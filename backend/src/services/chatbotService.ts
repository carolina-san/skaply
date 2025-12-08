import { SessionsClient, protos } from "@google-cloud/dialogflow";
import { struct } from "pb-util";

export class DialogflowService {
    private sessionClient: SessionsClient;
    private projectId: string;

    constructor() {
        this.projectId = "allen-hmmc";

        this.sessionClient = new SessionsClient({
            keyFilename: "dialogflow.json"
        });
    }

    private getSessionPath(sessionId: string) {
        return this.sessionClient.projectAgentSessionPath(
            this.projectId,
            sessionId
        );
    }

    async sendTextMessage(sessionId: string, text: string, contextRef?: string) {
        const sessionPath = this.getSessionPath(sessionId);

        const request: protos.google.cloud.dialogflow.v2.IDetectIntentRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text,
                    languageCode: "es"
                }
            },
            queryParams: {
                contexts: contextRef
                    ? [
                        {
                            name: `${sessionPath}/contexts/prueba-context`,
                            lifespanCount: 3,
                            parameters: struct.encode({ furniture_ref: contextRef })
                        }
                    ]
                    : []
            }
        };

        const [response] = await this.sessionClient.detectIntent(request);
        return response.queryResult;
    }

    async sendEvent(sessionId: string, event: string, params?: any) {
        const sessionPath = this.getSessionPath(sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                event: {
                    name: event,
                    parameters: params ? struct.encode(params) : undefined,
                    languageCode: "es"
                }
            }
        };

        const [response] = await this.sessionClient.detectIntent(request);
        return response.queryResult;
    }
}
