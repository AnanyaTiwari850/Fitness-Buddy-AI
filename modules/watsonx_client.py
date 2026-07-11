"""
watsonx_client.py
─────────────────
Thin wrapper around IBM watsonx.ai that handles authentication,
token refresh, and text generation for Fitness Buddy.
"""

import os
import logging
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

logger = logging.getLogger(__name__)

# ─── Model configuration ──────────────────────────────────────────────────────
MODEL_ID = "meta-llama/llama-3-3-70b-instruct"          

GENERATION_PARAMS = {
    GenParams.MAX_NEW_TOKENS: 1024,
    GenParams.MIN_NEW_TOKENS: 20,
    GenParams.TEMPERATURE: 0.7,
    GenParams.TOP_P: 0.9,
    GenParams.TOP_K: 50,
    GenParams.REPETITION_PENALTY: 1.1,
    GenParams.STOP_SEQUENCES: ["<|endoftext|>", "Human:", "User:"],
}
# ──────────────────────────────────────────────────────────────────────────────


_model_instance: ModelInference | None = None


def _get_model() -> ModelInference:
    """Return a cached ModelInference instance, creating one if necessary."""
    global _model_instance
    if _model_instance is None:
        api_key = os.getenv("IBM_API_KEY")
        project_id = os.getenv("WATSONX_PROJECT_ID")
        url = os.getenv("WATSONX_URL", "https://jp-tok.ml.cloud.ibm.com")

        if not api_key or not project_id:
            raise EnvironmentError(
                "IBM_API_KEY and WATSONX_PROJECT_ID must be set in the .env file."
            )

        credentials = Credentials(url=url, api_key=api_key)
        client = APIClient(credentials=credentials, project_id=project_id)
        _model_instance = ModelInference(
            model_id=MODEL_ID,
            api_client=client,
            params=GENERATION_PARAMS,
            project_id=project_id,
        )
        logger.info("watsonx.ai ModelInference initialised (%s)", MODEL_ID)
    return _model_instance


def generate_response(prompt: str) -> str:
    """
    Send *prompt* to the model and return the generated text.

    Args:
        prompt: The fully-constructed prompt string.

    Returns:
        Generated response text, stripped of leading/trailing whitespace.

    Raises:
        RuntimeError: If the API call fails.
    """
    try:
        model = _get_model()
        response = model.generate_text(prompt=prompt)
        return response.strip() if isinstance(response, str) else str(response).strip()
    except EnvironmentError:
        raise
    except Exception as exc:
        logger.error("watsonx.ai generation error: %s", exc, exc_info=True)
        raise RuntimeError(f"AI model error: {exc}") from exc
