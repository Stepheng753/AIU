import { useState, useEffect, useRef, useContext } from 'react';
import { Audio } from 'expo-av';
import { AuthContext } from '../context/AuthContext';

export function useInterviewManager() {
  const [transcript, setTranscript] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const recordingRef = useRef(null);
  const { token, logout } = useContext(AuthContext);

  const connectToBFF = async () => {
    try {
      if (!token) return;
      
      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const historyRes = await fetch(`${API_URL}/history`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true'
        }
      });
      
      if (historyRes.ok) {
        const history = await historyRes.json();
        const formattedHistory = history.flatMap(item => [
          { id: `q_${item.id}`, role: 'ai', text: item.question },
          { id: `a_${item.id}`, role: 'user', text: item.answer, dbId: item.id }
        ]);
        setTranscript(formattedHistory);
      } else if (historyRes.status === 401 || historyRes.status === 403) {
        logout();
        return;
      }

      const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
      wsRef.current = new WebSocket(`${WS_URL}?token=${token}`);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Connected to BFF WS');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'proxy_status') return;
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('Failed to connect', err);
    }
  };

  useEffect(() => {
    connectToBFF();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [token]);

  const removePair = async (dbId) => {
    if (wsRef.current) wsRef.current.close();
    
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    await fetch(`${API_URL}/pair/${dbId}`, { 
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Bypass-Tunnel-Reminder': 'true'
      }
    });

    await connectToBFF();
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
    }
  };

  return {
    transcript,
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    removePair,
    logout
  };
}
