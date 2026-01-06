(function() {
    class Microphone {
        constructor(runtime) {
            this.runtime = runtime;
            this.isLiveRecording = false;
            this.liveRecordingSegments = [];
            this.liveMicrophoneLoaded = false;
            navigator.mediaDevices.getUserMedia({audio: true}).then(stream=>{
                this.liveRecorder = new MediaRecorder(stream);
                this.liveMicrophoneLoaded = true

                })
        }

        getInfo() {
            return {
                id: 'microphone',
                name: 'Microphone',
                blocks: [
                    {
                        opcode: 'sectionAudio',
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Basic Audio Recording'
                    },
                    {
                        
                        opcode: 'MicRecord',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Start basic audio recording for [SECONDS] seconds as [FORMAT]',
                        arguments: {
                            SECONDS: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 3
                            },
                            FORMAT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "FORMAT_MENU"
                            }
                        }
                    },
                    {
                        opcode: 'sectionAudio',
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Live Audio Recording'
                    },
                    {
                        opcode: 'startLiveRecord',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Start Live Recording',
                    },

                    {
                        opcode: 'getRecordingStop',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Return current recording as [FORMAT] and stop',
                        arguments: {
                            FORMAT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "FORMAT_MENU"
                            }
                        },
                        disableMonitor: true
                    },
                    {
                        opcode: 'getRecordingCont',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Return current recording as [FORMAT] and continue recording [SAVE]',
                        arguments: {
                            FORMAT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "FORMAT_MENU"
                            },
                            SAVE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "CLEAR_TYPE"
                            }
                        },
                        disableMonitor: true
                    },
                    {
                        opcode: 'sectionAudio',
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Events'
                    },
                    {
                        blockType: Scratch.BlockType.EVENT,
                        opcode: 'whenSegmentRecorded',
                        text: 'when new audio segment recorded in [STREAM] recording',
                        isEdgeActivated: false, // required boilerplate,
                        arguments: {
                            STREAM: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "STREAM_TYPE"
                            }
                        }
                    },
                    {
                        opcode: 'sectionAudio',
                        blockType: Scratch.BlockType.LABEL,
                        text: 'Debug'
                    },
                    {
                        opcode: 'isRecording',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Is live recording active?',
                    },
                    {
                        opcode: 'blob2url',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Convert blob [BLOB] to URL',
                        arguments: {
                            BLOB: {
                                type: Scratch.ArgumentType.STRING
                            }
                        }
                    },
                ],
                menus:{     
                    FORMAT_MENU: {
                        acceptReporters: false,
                        items: [
                            {
                                text: 'blob',
                                value: false
                            },
                            {
                                text: 'URL',
                                value: true
                            }
                        ]
                    },
                    CLEAR_TYPE: {
                        acceptReporters: false,
                        items: [
                            {
                                text: 'without clearing live recording',
                                value: false
                            },
                            {
                                text: 'after clearing live recording',
                                value: true
                            },

                        ]
                    },
                    STREAM_TYPE: {
                        acceptReporters: false,
                        items: [
                            {
                                text: 'Live',
                                value: 'live'
                            },
                            {
                                text: 'Basic',
                                value: 'basic'
                            },

                        ]
                    }
                }
            };
        }
    blob2url(args) {
        return(URL.createObjectURL(args.BLOB))
    }
    isRecording() {
        return(this.isLiveRecording)
    }
    MicRecord(args) {
        const recording_time = Number(args.SECONDS) || 3;
        const convert_to_URL=args.FORMAT
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({audio: true}).then(stream=>{
                const recorder = new MediaRecorder(stream)
                let audioSegments = [];
                recorder.start(100);
                recorder.ondataavailable= event => {
                    audioSegments.push(event.data)
                    Scratch.vm.runtime.startHats('microphone_whenSegmentRecorded', {STREAM: "basic"});
                }
                setTimeout(() => recorder.stop(), recording_time * 1000);
                recorder.onstop= event => {
                let blob = new Blob(audioSegments, { type: 'audio/webm' });
                let result = null
                if (convert_to_URL) {
                    result = URL.createObjectURL(blob)
                } else {
                    result = blob
                }
                resolve(result)
                }
            })
            .catch(err => {
                console.error("Microphone access failed:", err);
            });

        });
    }
    startLiveRecord() {
        if (this.liveMicrophoneLoaded){
            if (!this.isLiveRecording) {
                this.isLiveRecording=true
                this.liveRecordingSegments=[]
                this.liveRecorder.start(50)
                this.liveRecorder.ondataavailable= event => {
                    Scratch.vm.runtime.startHats('microphone_whenSegmentRecorded', {STREAM: "live"});
                    this.liveRecordingSegments.push(event.data)
                }
            }
        }
    }
    getRecording(convert_to_URL) {
        let blob = new Blob(this.liveRecordingSegments, { type: 'audio/webm'})
        let result = blob
        if (convert_to_URL) {
            result = URL.createObjectURL(blob)
        }
        return result
    }
    getRecordingStop(args) {
        this.liveRecorder.stop()
        this.isLiveRecording = false
        return this.getRecording(args.FORMAT)
    }
    getRecordingCont(args) {
        const CurrentRecording = this.getRecording(args.FORMAT)
        if (args.SAVE) {
            this.liveRecordingSegments = [];
        };
        return CurrentRecording
    }
    }

    Scratch.extensions.register(new Microphone());
})();
