const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AudioProcessor {
    constructor() {
        this.audioDir = path.join(__dirname, 'audio_files');
        this.ensureAudioDirectory();
    }

    ensureAudioDirectory() {
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }
    }

    async saveAudioBuffer(audioBuffer, callerId) {
        const filename = `call_${callerId}_${Date.now()}.wav`;
        const filepath = path.join(this.audioDir, filename);
        
        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, audioBuffer, (err) => {
                if (err) reject(err);
                else resolve(filepath);
            });
        });
    }

    async analyzeEmotion(audioPath) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', ['ser_model.py', audioPath]);
            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    const analysis = JSON.parse(result);
                    resolve(analysis);
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${result}`));
                }
            });
        });
    }

    async processAudioStream(audioBuffer, callerId) {
        try {
            // Save audio buffer to file
            const audioPath = await this.saveAudioBuffer(audioBuffer, callerId);
            
            // Analyze emotion using Python script
            const analysis = await this.analyzeEmotion(audioPath);
            
            // Clean up the audio file
            fs.unlink(audioPath, (err) => {
                if (err) console.error('Error deleting audio file:', err);
            });
            
            return analysis;
        } catch (error) {
            console.error('Error processing audio:', error);
            throw error;
        }
    }

    cleanupOldFiles() {
        const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        fs.readdir(this.audioDir, (err, files) => {
            if (err) {
                console.error('Error reading audio directory:', err);
                return;
            }

            const now = Date.now();
            files.forEach(file => {
                const filePath = path.join(this.audioDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error('Error getting file stats:', err);
                        return;
                    }

                    if (now - stats.mtime.getTime() > MAX_AGE) {
                        fs.unlink(filePath, err => {
                            if (err) console.error('Error deleting old file:', err);
                        });
                    }
                });
            });
        });
    }
}

module.exports = new AudioProcessor(); 