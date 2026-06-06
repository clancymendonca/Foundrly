'use client'
import { Mic, MicOff } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void
  className?: string
}

const VoiceSearchButton = ({ onTranscript, className = '' }: VoiceSearchButtonProps) => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        onTranscript(transcript)
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  if (!isSupported) {
    return null // Don't render if speech recognition is not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`search-btn text-white ${className} ${isListening ? 'bg-red-500' : ''}`}
      title={isListening ? 'Stop listening' : 'Start voice search'}
    >
      {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
    </button>
  )
}

export default VoiceSearchButton
