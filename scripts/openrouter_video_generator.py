import os
import requests
import json
import time
from typing import Optional, List, Dict
from dataclasses import dataclass

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
VIDEO_URL = "https://openrouter.ai/api/v1/videos"


@dataclass
class VideoJob:
    job_id: str
    polling_url: str
    status: str = "pending"


class OpenRouterVideoGenerator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def chat_with_model(self, messages: List[Dict[str, str]], model: str = "openai/gpt-4o-mini") -> Optional[str]:
        """Chat with the model to generate a video prompt."""
        try:
            response = requests.post(
                CHAT_URL,
                headers=self.headers,
                data=json.dumps({
                    "model": model,
                    "messages": messages
                }),
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except requests.exceptions.RequestException as e:
            print(f"❌ Error chatting with model: {e}")
            return None
        except (KeyError, IndexError) as e:
            print(f"❌ Error parsing model response: {e}")
            return None

    def generate_video(self, prompt: str, model: str = "kwaivgi/kling-v3.0-pro") -> Optional[VideoJob]:
        """Generate a video from the prompt."""
        try:
            print(f"\n🚀 Generating video with prompt: {prompt[:100]}...")
            response = requests.post(
                VIDEO_URL,
                headers=self.headers,
                data=json.dumps({
                    "model": model,
                    "prompt": prompt
                }),
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            job_id = result.get("id")
            polling_url = result.get("polling_url")
            
            if not job_id or not polling_url:
                print("❌ Invalid response: missing job_id or polling_url")
                return None
                
            print(f"🎬 Job created: {job_id}")
            return VideoJob(job_id=job_id, polling_url=polling_url)
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error generating video: {e}")
            return None
        except (KeyError, IndexError) as e:
            print(f"❌ Error parsing video response: {e}")
            return None

    def wait_for_video(self, job: VideoJob, poll_interval: int = 5, max_retries: int = 60) -> Optional[List[str]]:
        """Poll for video completion."""
        retries = 0
        
        while retries < max_retries:
            try:
                poll_response = requests.get(
                    job.polling_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=30
                )
                poll_response.raise_for_status()
                status_data = poll_response.json()
                status = status_data.get("status", "unknown")
                
                print(f"⏳ Status: {status} (attempt {retries + 1}/{max_retries})")
                
                if status == "completed":
                    urls = status_data.get("unsigned_urls", [])
                    print("\n✅ Video ready:")
                    for url in urls:
                        print(f"   {url}")
                    return urls
                    
                elif status == "failed":
                    error = status_data.get("error", "Unknown error")
                    print(f"❌ Video generation failed: {error}")
                    return None
                    
                elif status in ["pending", "processing"]:
                    time.sleep(poll_interval)
                    retries += 1
                    
                else:
                    print(f"⚠️ Unknown status: {status}")
                    time.sleep(poll_interval)
                    retries += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Error polling video status: {e}")
                retries += 1
                time.sleep(poll_interval)
                
        print(f"❌ Timeout: video not ready after {max_retries} attempts")
        return None


def main():
    """Main interactive loop."""
    if OPENROUTER_API_KEY == "YOUR_API_KEY_HERE":
        print("⚠️ Please set OPENROUTER_API_KEY environment variable")
        return

    generator = OpenRouterVideoGenerator(OPENROUTER_API_KEY)
    
    messages = [
        {"role": "system", "content": "Sei un assistente creativo che genera prompt per video cinematici. I prompt devono essere descrittivi, visivi e adatti per la generazione video."}
    ]

    print("🎬 OpenRouter Video Generator")
    print("Type 'exit' or 'quit' to stop\n")

    while True:
        try:
            user_input = input("\n👤 You: ").strip()
            
            if user_input.lower() in ["exit", "quit"]:
                print("👋 Goodbye!")
                break
                
            if not user_input:
                continue

            # Chat with model to get video prompt
            messages.append({"role": "user", "content": user_input})
            
            print("\n🤖 Generating video prompt...")
            reply = generator.chat_with_model(messages)
            
            if not reply:
                print("❌ Failed to get response from model")
                continue
                
            print(f"\n🤖 Model:\n{reply}")
            messages.append({"role": "assistant", "content": reply})

            # Generate video
            job = generator.generate_video(reply)
            
            if not job:
                print("❌ Failed to start video generation")
                continue
                
            # Wait for video
            video_urls = generator.wait_for_video(job)
            
            if video_urls:
                print(f"\n🎉 Successfully generated {len(video_urls)} video(s)")
            else:
                print("\n⚠️ Video generation failed or timed out")
                
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
