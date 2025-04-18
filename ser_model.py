import librosa
import json
import sys
import os

class EmotionRecognizer:
    def __init__(self):
        self.emotions = ['angry', 'fear', 'happy', 'neutral', 'sad']
        
    def extract_features(self, audio_path):
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, duration=3)
            
            # Extract basic features using librosa's built-in functions
            features = {}
            features['rms'] = float(librosa.feature.rms(y=y).mean())  # Energy/volume
            features['zcr'] = float(librosa.feature.zero_crossing_rate(y).mean())  # Zero crossing rate
            
            # Calculate pitch using librosa's built-in function
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            features['pitch'] = float(pitches.mean())
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {str(e)}", file=sys.stderr)
            return None

    def predict_emotion(self, audio_path):
        try:
            # Extract features
            features = self.extract_features(audio_path)
            if features is None:
                return json.dumps({"error": "Failed to extract features"})
            
            # Simple rule-based classification
            # High energy + high pitch = angry/happy
            # Low energy + low pitch = sad/fear
            # Medium values = neutral
            
            energy_threshold = 0.1
            pitch_threshold = 200
            
            if features['rms'] > energy_threshold:
                if features['pitch'] > pitch_threshold:
                    primary_emotion = 'angry' if features['zcr'] > 0.1 else 'happy'
                else:
                    primary_emotion = 'happy'
            else:
                if features['pitch'] < pitch_threshold/2:
                    primary_emotion = 'sad'
                else:
                    primary_emotion = 'fear' if features['zcr'] > 0.08 else 'neutral'
            
            # Generate pseudo-probabilities
            base_confidence = 0.4
            predictions = {emotion: 0.1 for emotion in self.emotions}
            predictions[primary_emotion] = base_confidence
            
            # Normalize probabilities
            total = sum(predictions.values())
            predictions = {k: v/total for k, v in predictions.items()}
            
            result = {
                "emotion": primary_emotion,
                "confidence": predictions[primary_emotion],
                "predictions": predictions
            }
            
            return json.dumps(result)
            
        except Exception as e:
            return json.dumps({"error": str(e)})

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Audio file path not provided"}))
        sys.exit(1)
        
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"error": "Audio file not found"}))
        sys.exit(1)
        
    recognizer = EmotionRecognizer()
    result = recognizer.predict_emotion(audio_path)
    print(result)

if __name__ == "__main__":
    main() 