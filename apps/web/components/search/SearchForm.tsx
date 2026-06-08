'use client'
import Form from 'next/form'
import SearchFormReset from './SearchFormReset'
import VoiceSearchButton from '@/components/ai/VoiceSearchButton'
import { Search } from 'lucide-react'
import { useRef } from 'react'

const SearchForm = ({query}: {query?:string}) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleVoiceTranscript = (transcript: string) => {
        if (inputRef.current) {
            inputRef.current.value = transcript
        }
    }

    return (

        <Form action="/" scroll={false} className="search-form">
            
        <input 
            ref={inputRef}
            name='query'  
            defaultValue={query}
            className="search-input"
            placeholder="Search startups with AI..."
        /> 

        <div className="flex gap-2">
            {query && <SearchFormReset />}

            <VoiceSearchButton onTranscript={handleVoiceTranscript} />

            <button type="submit" className="search-btn text-white">
                <Search className='size-5'/>
            </button>

        </div>

        </Form>

    )
}

export default SearchForm