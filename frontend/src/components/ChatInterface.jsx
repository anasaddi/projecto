import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage = {
      role: 'user',
      content: input,
      files: attachedFiles.map(f => f.name),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // Prepare frame images from attached files
      const frameImages = attachedFiles.length > 0 ? [
        {
          frame_type: 'first_frame',
          image_url: attachedFiles[0].name // In real implementation, you'd upload the file first
        }
      ] : undefined;

      const requestBody = {
        model: 'kwaivgi/kling-v3.0-pro',
        prompt: input
      };

      // Only add frame_images if they exist
      if (frameImages) {
        requestBody.frame_images = frameImages;
      }

      console.log('Request body:', requestBody);

      const apiKey = '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';
      console.log('API Key length:', apiKey.length);
      console.log('API Key starts with:', apiKey.substring(0, 10));

      // First, check if API key works with models endpoint
      console.log('Testing API key with models endpoint...');
      const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log('Models response status:', modelsResponse.status);
      if (!modelsResponse.ok) {
        const errorText = await modelsResponse.text();
        console.error('Models API error:', errorText);
        throw new Error(`API key invalid: ${errorText}`);
      }

      // Call OpenRouter Video Generation API with Kling Pro
      console.log('Sending video generation request...');
      const response = await fetch('https://openrouter.ai/api/v1/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.id && data.polling_url) {
        const assistantMessage = {
          role: 'assistant',
          content: `🎬 Video generation started!\nJob ID: ${data.id}\nPolling for completion...`,
          jobId: data.id,
          pollingUrl: data.polling_url,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Start polling for video completion
        pollForVideo(data.polling_url, data.id);
      } else {
        throw new Error('Invalid response from video API');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Errore nella generazione video. Controlla la console per dettagli.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const pollForVideo = async (pollingUrl, jobId) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(pollingUrl, {
          headers: {
            'Authorization': 'Bearer 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'
          }
        });

        const data = await response.json();

        if (data.status === 'completed') {
          const videoUrls = data.unsigned_urls || [];
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Video completato!\n\nVideo URLs:\n${videoUrls.map(url => `• ${url}`).join('\n')}`,
            videoUrls: videoUrls,
            timestamp: new Date().toISOString()
          }]);
        } else if (data.status === 'failed') {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Video generation failed: ${data.error || 'Unknown error'}`,
            timestamp: new Date().toISOString()
          }]);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⏱️ Video generation timed out. Controlla più tardi.',
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Error polling video status:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Video Generator AI</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Kling Pro - Genera video da testo</p>
        </div>
        <button
          onClick={() => setMessages([])}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          Nuova chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
            <Send className="w-12 h-12 mb-4" />
            <p className="text-lg">Genera video con Kling Pro</p>
            <p className="text-sm mt-2">Descrivi il video che vuoi creare</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {message.files && message.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.files.map((file, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/20 px-2 py-1 rounded-full"
                    >
                      📎 {file}
                    </span>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.videoUrls && message.videoUrls.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.videoUrls.map((url, i) => (
                    <div key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline block"
                      >
                        🎥 Video {i + 1}
                      </a>
                      <video
                        controls
                        className="mt-2 rounded-lg max-w-full"
                        style={{ maxHeight: '300px' }}
                      >
                        <source src={url} type="video/mp4" />
                        Il tuo browser non supporta il video.
                      </video>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-700 px-3 py-1.5 rounded-full text-sm"
              >
                <span className="truncate max-w-[150px]">📎 {file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            title="Allega file"
          >
            <Paperclip className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Descrivi il video che vuoi creare..."
            className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
            title="Invia"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
