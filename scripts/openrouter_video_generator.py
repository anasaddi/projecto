import os
import requests
import json
import time
from typing import Optional, List, Dict
from dataclasses import dataclass

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY env var required")
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

    def generate_video(
        self,
        prompt: str,
        model: str = "kwaivgi/kling-v3.0-pro",
        frame_images: Optional[List[Dict[str, str]]] = None,
        input_references: Optional[List[str]] = None
    ) -> Optional[VideoJob]:
        """Generate a video from the prompt with optional image references."""
        try:
            print(f"\n🚀 Generating video with prompt: {prompt[:100]}...")
            
            payload = {
                "model": model,
                "prompt": prompt
            }
            
            # Add frame images for image-to-video
            if frame_images:
                payload["frame_images"] = frame_images
                print(f"📸 Using {len(frame_images)} frame image(s)")
            
            # Add input references for style/content references
            if input_references:
                payload["input_references"] = input_references
                print(f"🖼️ Using {len(input_references)} reference image(s)")
            
            response = requests.post(
                VIDEO_URL,
                headers=self.headers,
                data=json.dumps(payload),
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
    print("💡 Tips:")
    print("   - Type 'ref:' followed by image URL to use reference images")
    print("   - Type 'frame:' followed by image URL to use as first/last frame")
    print("   - Example: 'A sunset over the ocean ref:https://example.com/image.jpg'\n")

    frame_images = []
    input_references = []

    while True:
        try:
            user_input = input("\n👤 You: ").strip()

            if user_input.lower() in ["exit", "quit"]:
                print("👋 Goodbye!")
                break

            if not user_input:
                continue

            # Check for image references in input
            if "ref:" in user_input:
                parts = user_input.split("ref:")
                if len(parts) > 1:
                    ref_url = parts[1].strip().split()[0]  # Get first word after ref:
                    input_references.append(ref_url)
                    print(f"🖼️ Added reference image: {ref_url}")
                    user_input = parts[0].strip()  # Remove ref: from prompt

            if "frame:" in user_input:
                parts = user_input.split("frame:")
                if len(parts) > 1:
                    frame_url = parts[1].strip().split()[0]  # Get first word after frame:
                    frame_images.append({"frame_type": "first_frame", "image_url": frame_url})
                    print(f"📸 Added frame image: {frame_url}")
                    user_input = parts[0].strip()  # Remove frame: from prompt

            if not user_input and (frame_images or input_references):
                print("⚠️ No text prompt provided, using only image references")

            # Chat with model to get video prompt (if there's text input)
            if user_input:
                messages.append({"role": "user", "content": user_input})

                print("\n🤖 Generating video prompt...")
                reply = generator.chat_with_model(messages)

                if not reply:
                    print("❌ Failed to get response from model")
                    continue

                print(f"\n🤖 Model:\n{reply}")
                messages.append({"role": "assistant", "content": reply})
            else:
                reply = "Video from image references"

            # Generate video with image references
            job = generator.generate_video(
                reply,
                frame_images=frame_images if frame_images else None,
                input_references=input_references if input_references else None
            )

            if not job:
                print("❌ Failed to start video generation")
                continue

            # Clear references for next iteration
            frame_images = []
            input_references = []

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
