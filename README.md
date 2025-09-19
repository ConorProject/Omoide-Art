# 🎨 Omoide Art (思い出アート)

> Your Japan memories, painted by AI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-omoide--art.shop-blue?style=for-the-badge)](https://omoide-art.shop)

![App Screenshot](https://via.placeholder.com/800x450.png?text=Add+A+Screenshot+of+Omoide+Art+Here)
*(This README is ready for you to add a screenshot of your live application!)*

---

## About Omoide Art

Every trip to Japan leaves behind cherished, dream-like memories: the feeling of a misty morning at a mountain temple, the vibrant energy of a Tokyo street at night, the serene beauty of an autumn garden. Capturing that specific feeling is difficult. While AI art tools are powerful, their results are often random, technical to control, and fail to capture the personal essence of a memory.

**Omoide Art** is a bridge to that feeling.

It is a guided web experience that acts as an "AI artist's interview," asking simple but specific questions to pinpoint a single, cherished moment from your journey. It then translates your words and feelings into a unique, high-quality piece of art in a curated Ukiyo-e inspired style. The result is not just a picture *of* Japan, but a picture of *your memory* of Japan.

## Key Features

* **Guided Memory Interview:** A five-step questionnaire to pinpoint the location, atmosphere, focal point, unique details, and feeling of a specific moment.
* **Curated Artistic Styles:** A selection of consistent, high-quality art styles inspired by Ukiyo-e masters.
* **Personalized Results:** Combines user inputs into a complex, "secret sauce" prompt to generate a hyper-specific, personal piece of art.
* **Seamless Experience:** A simple, elegant interface designed to be calm and reflective, not technical.

## Tech Stack

This MVP was built with a focus on speed, scalability, and a modern developer experience.

* **Frontend:** HTML, CSS, JavaScript
* **Code Generation Assistance:** Google Gemini & Anthropic Claude
* **Hosting & Serverless Backend:** Vercel
* **AI Image Generation:** Wavespeed AI (Imagen 4.0 Ultra)
* **AI Prompt Enhancement:** Google Gemini 1.5 Flash
* **Storage:** Vercel Blob (for gallery metadata)
* **Source Control:** GitHub

## Getting Started (Local Development)

To get a local copy up and running, follow these steps.

### Prerequisites

You will need API keys from Google Gemini and Wavespeed AI for image generation.

### Installation

1.  Clone the repository:
    ```sh
    git clone [https://github.com/your-username/omoide-art.git](https://github.com/your-username/omoide-art.git)
    ```
2.  Navigate into the project directory:
    ```sh
    cd omoide-art
    ```
3.  Install the Vercel CLI, which will allow you to run the serverless functions locally:
    ```sh
    npm install -g vercel
    ```
4.  Create a local environment file named `.env.local`. This file will store your secret API keys and must **not** be committed to GitHub.
    ```
    GEMINI_API_KEY='Your-Gemini-API-Key-Goes-Here'
    WAVESPEED_API_KEY='Your-Wavespeed-API-Key-Goes-Here'
    WEBHOOK_SECRET='webhook-secret-key'
    ```
5.  Run the local development server:
    ```sh
    vercel dev
    ```
    This will start a local server and allow you to test your API functions.

## Project Roadmap

* **V1.1: Physical Products** - Integrate with a Print-on-Demand service like Printify or Printful to allow users to order framed prints, canvases, and other physical goods.
* **V2.0: The Omoide Collage** - Introduce a new feature allowing users to select multiple landmarks from a trip and have them composed into a "journey collage."
* **V2.1: The Cartographer's Map** - Build the original map-based idea, allowing users to upload GPS data to create a stylized map of their route.
* **V3.0: More Styles & Locations** - Expand the art style library beyond Ukiyo-e and add curated location data for other countries.

## License
