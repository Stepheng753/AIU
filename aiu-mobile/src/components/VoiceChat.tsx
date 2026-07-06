import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { Mic, Volume2, Loader2, MicOff } from 'lucide-react-native';
import { ThemeColors } from '../themes/themeColors';

interface VoiceChatProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  statusText: string;
  disabled?: boolean;
  colors: ThemeColors;
}

export default function VoiceChat({
  isListening,
  isProcessing,
  isSpeaking,
  onClick,
  statusText,
  disabled = false,
  colors
}: VoiceChatProps) {
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(4));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reanimated shared values for glowing pulses and waves
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);
  const ringScale1 = useSharedValue(1);
  const ringOpacity1 = useSharedValue(0);
  const ringScale2 = useSharedValue(1);
  const ringOpacity2 = useSharedValue(0);

  // Active theme color matching current states
  const getThemeColor = () => {
    if (isListening) return colors.primary;
    if (isProcessing) return colors.secondary; // Usually gold/yellow in themes
    if (isSpeaking) return '#10b981'; // Green
    return colors.mutedForeground;
  };

  const activeColor = getThemeColor();

  // Particle pulsing animation
  useEffect(() => {
    if (isListening || isSpeaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }
  }, [isListening, isSpeaking]);

  // Outer double rings animation for listening
  useEffect(() => {
    if (isListening) {
      ringScale1.value = 1;
      ringOpacity1.value = 0.6;
      ringScale1.value = withRepeat(
        withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ringOpacity1.value = withRepeat(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );

      // Delayed second ring
      ringScale2.value = 1;
      ringOpacity2.value = 0.6;
      ringScale2.value = withRepeat(
        withDelay(
          750,
          withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      ringOpacity2.value = withRepeat(
        withDelay(750, withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) })),
        -1,
        false
      );
    } else {
      ringOpacity1.value = withTiming(0);
      ringOpacity2.value = withTiming(0);
    }
  }, [isListening]);

  // Bouncing audio waveform simulation
  useEffect(() => {
    if (isListening || isSpeaking) {
      const maxVal = isListening ? 26 : 18;
      timerRef.current = setInterval(() => {
        const newWaveform = Array(32)
          .fill(0)
          .map(() => Math.floor(Math.random() * maxVal) + 4);
        setWaveformData(newWaveform);
      }, 80);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setWaveformData(Array(32).fill(4));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isSpeaking]);

  const glowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: pulseOpacity.value
    };
  });

  const ringStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale1.value }],
      opacity: ringOpacity1.value
    };
  });

  const ringStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale2.value }],
      opacity: ringOpacity2.value
    };
  });

  const renderIcon = () => {
    if (isProcessing) {
      return <ActivityIndicator size="small" color={activeColor} />;
    }
    if (isSpeaking) {
      return <Volume2 size={26} color={activeColor} />;
    }
    if (isListening) {
      return <Mic size={26} color={activeColor} />;
    }
    return <MicOff size={26} color={colors.mutedForeground} />;
  };

  return (
    <View style={styles.container}>
      {/* Background glow orb */}
      {(isListening || isSpeaking) && (
        <Animated.View
          style={[
            styles.glowOrb,
            glowStyle,
            { backgroundColor: activeColor }
          ]}
        />
      )}

      {/* Button & Ring Wrapper */}
      <View style={styles.buttonWrapper}>
        {/* Pulsing ring 1 */}
        <Animated.View
          style={[
            styles.pulseRing,
            ringStyle1,
            { borderColor: activeColor }
          ]}
        />

        {/* Pulsing ring 2 */}
        <Animated.View
          style={[
            styles.pulseRing,
            ringStyle2,
            { borderColor: activeColor }
          ]}
        />

        <TouchableOpacity
          onPress={disabled ? undefined : onClick}
          disabled={disabled}
          style={[
            styles.micBtn,
            {
              borderColor: activeColor,
              backgroundColor: colors.card,
              shadowColor: activeColor,
            },
            isListening || isSpeaking ? styles.micBtnActiveGlow : styles.micBtnIdleGlow
          ]}
          activeOpacity={0.8}
        >
          {renderIcon()}
        </TouchableOpacity>
      </View>

      {/* 32-Bar Waveform */}
      <View style={styles.waveformContainer}>
        {waveformData.map((height, idx) => (
          <View
            key={idx}
            style={[
              styles.waveBar,
              {
                height: height,
                backgroundColor: activeColor,
                opacity: isListening || isSpeaking ? 1.0 : 0.15
              }
            ]}
          />
        ))}
      </View>

      {/* Status Label */}
      <View style={styles.statusLabelContainer}>
        <Text style={[styles.statusText, { color: activeColor }]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    paddingVertical: 16,
  },
  glowOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    filter: 'blur(30px)', // Expo/React Native support blur filter in newer platforms
    opacity: 0.15,
  },
  buttonWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  micBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnIdleGlow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  micBtnActiveGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 32,
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  statusLabelContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
});
