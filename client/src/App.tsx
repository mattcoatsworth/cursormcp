import { useState } from 'react'
import AppChat from './components/chat/AppChat'
import { type ChatMessageWithStringId, type ApiConnection } from '@shared/schema'

function App() {
  const [chatMessages, setChatMessages] = useState<ChatMessageWithStringId[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [apiConnections, setApiConnections] = useState<ApiConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)

  const handleSendMessage = (content: string) => {
    // In development mode, just add the message locally
    const newMessage: ChatMessageWithStringId = {
      id: Date.now().toString(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'dev-user',
      channelId: 'dev-channel'
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const handleToggleConnection = (id: number | string, isConnected: boolean, type: string) => {
    // In development mode, just update the connection locally
    setApiConnections(prev =>
      prev.map(conn =>
        conn.id === id ? { ...conn, isConnected } : conn
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppChat
        currentApp="chat"
        chatMessages={chatMessages}
        isLoadingMessages={isLoadingMessages}
        sendMessage={handleSendMessage}
        isPending={isPending}
        apiConnections={apiConnections}
        isLoadingConnections={isLoadingConnections}
        onToggleConnection={handleToggleConnection}
      />
    </div>
  )
}

export default App
