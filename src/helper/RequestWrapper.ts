import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { GoogleApiError } from "../googleApi/GoogleApiError";
import { requestUrl } from "obsidian";

export const callRequest = async (url: string, method: string, body: any, noAuth = false): Promise<any> => {

    const plugin = GoogleCalendarPlugin.getInstance();

    const requestHeaders = { 'Content-Type': 'application/json' };
    if (noAuth == false) {
        const bearer = await getGoogleAuthToken(plugin);
        if (!bearer) {
            throw new GoogleApiError("Error Google API request", 
                { method, url, body, },
                401,
                {error: "Missing Auth Token"}
            );
        }
        requestHeaders['Authorization'] = 'Bearer ' + bearer;
    }

    //Debugged request
    if (plugin.settings.debugMode) {
        console.log(`New Request ${method}:${url}`);
    
        const sanitizeHeader = { ...requestHeaders };
        if (sanitizeHeader['Authorization']) {
            sanitizeHeader['Authorization'] = sanitizeHeader['Authorization'].substring(0, 15) + "...";
        }
        console.log({ body, headers: sanitizeHeader });
        
        let response;
        try {
            response = await fetch(url, {
                method: method,
                body: body ? JSON.stringify(body) : null,
                headers: requestHeaders
            })
        }catch (error) {
            if(response) {
                throw new GoogleApiError("Error Google API request", 
                    { method, url, body, },
                    response.status,
                    (await response.json()),
                );
            } else {
                throw new GoogleApiError("Error Google API request", 
                    { method, url, body, },
                    500,
                    {error: "Unknown Error"},
                );
            }
        }

        if (response.status >= 300) {
            throw new GoogleApiError("Error Google API request", 
                { method, url, body, },
                response.status,
                (await response.json()),
            );
        }

        if (method.toLowerCase() == "delete") {
            return { status: "success" };
        }

        return (await response.json());
        
    }


        //Normal request
        let response;
        try { 
            response = await requestUrl({
                method: method,
                url: url,
                body: body ? JSON.stringify(body) : null,
                headers: requestHeaders,
                throw: false,
            });
        }catch (error) {
            if(response) {
            throw new GoogleApiError("Error Google API request", 
                { method, url, body, },
                response.status,
                (await response.json()),
            );
            } else {
                throw new GoogleApiError("Error Google API request", 
                { method, url, body, },
                500,
                {error: "Unknown Error"},
            );
            }
        }

        if (response.status >= 300) {
            throw new GoogleApiError("Error Google API request", 
                { method, url, body, },
                response.status,
                response.json,
            );
        }

        // For to indicate success because the response is empty
        if (method.toLowerCase() == "delete") {
            return { status: "success" };
        }

        return (await response.json);
}
