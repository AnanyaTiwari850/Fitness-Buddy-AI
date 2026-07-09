# 🏋️ Fitness Buddy — AI-Powered Personal Fitness Coach

> An intelligent fitness web application powered by **IBM watsonx.ai Granite** models.  
> Built with Python Flask, Bootstrap 5, and a modern responsive UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Fitness Coach** | Chat with IBM Granite 3 for personalised workout and nutrition advice |
| 🏃 **Workout Planner** | Generate AI-powered daily/weekly workout plans for any goal |
| ⚖️ **BMI Calculator** | Calculate BMI, daily calorie needs, ideal weight range, hydration goals |
| ✅ **Habit Tracker** | Track daily fitness habits, water intake, streaks, and get AI motivation |
| 👨‍👩‍👧 **Family Profiles** | Multiple user profiles with separate preferences and AI context |
| 🌙 **Dark/Light Mode** | Smooth theme toggle with localStorage persistence |
| 📱 **Mobile Responsive** | Fully responsive Bootstrap 5 layout |
| 🇮🇳 **Indian Diet Focus** | Nutrition guidance tailored to Indian meals and lifestyle |

---

## 🗂️ Project Structure

```
fitness_buddy/
├── app.py                    # Flask application entry point
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variable template
├── modules/
│   ├── __init__.py
│   ├── watsonx_client.py     # IBM watsonx.ai integration
│   └── fitness_utils.py      # BMI, calorie, water calculations
├── templates/
│   ├── base.html             # Base layout (navbar, footer)
│   ├── index.html            # Dashboard
│   ├── chat.html             # AI chat interface
│   ├── workout.html          # Workout planner
│   ├── bmi.html              # BMI calculator
│   ├── habits.html           # Habit tracker
│   └── profile.html          # Family profiles
└── static/
    ├── css/
    │   └── main.css          # All styles + dark mode + animations
    └── js/
        ├── main.js           # Theme toggle, tips, toast helper
        ├── chat.js           # Chat interface logic
        ├── workout.js        # Workout plan generation
        ├── bmi.js            # BMI results rendering
        ├── habits.js         # Habit tracking, water, streak
        ├── profile.js        # Profile CRUD operations
        └── dashboard.js      # Dashboard animations
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.10 or higher
- An **IBM Cloud account** with watsonx.ai access
- A **watsonx.ai project** created in your IBM Cloud account

### 2. Clone or download the project

```bash
# Navigate to the project folder
cd fitness_buddy
```

### 3. Create a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure IBM watsonx.ai credentials

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
IBM_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
FLASK_SECRET_KEY=your_random_secret_key_here
FLASK_ENV=development
```

### 6. Run the application

```bash
python app.py
```

Open your browser at **http://localhost:5000** 🎉

---

## 🔑 Getting IBM watsonx.ai Credentials

### Step 1 — IBM Cloud API Key

1. Go to [IBM Cloud](https://cloud.ibm.com)
2. Click your avatar (top right) → **Profile and settings**
3. Navigate to **Access (IAM)** → **API keys**
4. Click **Create an IBM Cloud API key**
5. Copy the key and save it in `.env` as `IBM_API_KEY`

### Step 2 — watsonx.ai Project ID

1. Go to [IBM watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
2. Click **Projects** in the sidebar
3. Create a new project or select an existing one
4. Go to **Manage** → **General**
5. Copy the **Project ID** and save it as `WATSONX_PROJECT_ID`

### Step 3 — Regional URL

| Region | URL |
|---|---|
| Dallas (default) | `https://us-south.ml.cloud.ibm.com` |
| Frankfurt | `https://eu-de.ml.cloud.ibm.com` |
| Tokyo | `https://jp-tok.ml.cloud.ibm.com` |
| London | `https://eu-gb.ml.cloud.ibm.com` |

---

## ⚙️ AGENT_INSTRUCTIONS — Customising the AI

The AI assistant's behaviour is controlled by the `AGENT_INSTRUCTIONS` constant at the top of [`app.py`](app.py). You can edit it freely without touching any other code.

```python
# In app.py — around line 35
AGENT_INSTRUCTIONS = """
You are Fitness Buddy, a friendly, supportive, and highly motivational virtual
fitness coach designed to help Indian families lead healthier lives.
...
"""
```

**Customisable sections:**

| Section | What to change |
|---|---|
| **Personality & Tone** | Formal/casual, language style, name |
| **Fitness Specialisation** | Focus areas (e.g. add running, swimming) |
| **Nutrition Guidance** | Dietary philosophy, regional cuisine focus |
| **Safety Rules** | Medical disclaimers, injury protocols |
| **Motivation Style** | Positive reinforcement, streaks, quotes |
| **Output Format** | Bullet points, tables, markdown headings |

---

## 🌐 Deployment

### Local Production (Gunicorn)

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Deploy to IBM Code Engine

```bash
# 1. Containerise
docker build -t fitness-buddy .

# 2. Push to IBM Container Registry and deploy via Code Engine
# Refer to: https://cloud.ibm.com/docs/codeengine
```

### Deploy to Render / Railway / Heroku

1. Set all environment variables (`IBM_API_KEY`, `WATSONX_PROJECT_ID`, etc.) in the platform's secrets/config panel.
2. Set the start command to: `gunicorn app:app`
3. Deploy from GitHub.

### Optional: Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "app:app"]
```

---

## 🛡️ Security Notes

- The `.env` file is **never** committed to version control (add it to `.gitignore`).
- All user input is validated on both client and server sides.
- Conversation history is stored in server-side Flask sessions (cookie-based).
- The app does not store any personal health data in a database.
- Always use HTTPS in production.

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Dashboard |
| `GET` | `/chat` | Chat interface |
| `POST` | `/api/chat` | Send message, get AI response |
| `POST` | `/api/chat/clear` | Clear conversation history |
| `GET` | `/workout` | Workout planner page |
| `POST` | `/api/workout/plan` | Generate AI workout plan |
| `GET` | `/bmi` | BMI calculator page |
| `POST` | `/api/bmi` | Calculate BMI + calorie + water stats |
| `GET` | `/habits` | Habit tracker page |
| `POST` | `/api/habits/motivate` | Get AI habit motivation |
| `GET` | `/profile` | Family profiles page |
| `POST` | `/api/profile/save` | Save/update a profile |
| `POST` | `/api/profile/switch` | Switch active profile |
| `POST` | `/api/profile/delete` | Delete a profile |

---

## 🧰 Tech Stack

- **Backend:** Python 3.10+, Flask 3.0, python-dotenv
- **AI Model:** IBM watsonx.ai — Meta Llama 3.3 70B instruct 
- **Frontend:** Bootstrap 5.3, Bootstrap Icons, Google Fonts (Inter)
- **Deployment:** Gunicorn, Docker-ready

---

## ⚠️ Disclaimer

Fitness Buddy provides general fitness and nutritional information for educational purposes only.  
It is **not a substitute for professional medical advice, diagnosis, or treatment**.  
Always consult a qualified doctor, physiotherapist, or dietitian for medical conditions, injuries, or specific health concerns.

---

*Made with ❤️ using IBM watsonx.ai Granite*
