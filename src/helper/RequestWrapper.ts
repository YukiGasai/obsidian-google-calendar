import { getGoogleAuthToken } from "../googleApi/GoogleAuth";
import GoogleCalendarPlugin from "../GoogleCalendarPlugin";
import { requestUrl } from "obsidian";

export const callRequest = async(url: string, method: string, body: any, noAuth = false):Promise<any> => {

    const plugin = GoogleCalendarPlugin.getInstance();

    const requestHeaders = {'Content-Type': 'application/json'};
    if(noAuth == false) { 
        const bearer = await getGoogleAuthToken(plugin);
        if(!bearer){
            return 
        }
        requestHeaders['Authorization'] =  'Bearer ' + bearer;
    }

    //Debugged request
    if(plugin.settings.debugMode)
    {
        console.log(`New Request ${method}:${url}`);    

        const sanitizeHeader = {...requestHeaders};
        if(sanitizeHeader['Authorization']){
            sanitizeHeader['Authorization'] = sanitizeHeader['Authorization'].substring(0, 15) + "...";
        }
        console.log({body,headers:sanitizeHeader});
        
        const response = await fetch(url, {
			method: method,
			body: body ? JSON.stringify(body) : null,
            headers: requestHeaders
		})

        if(response.status >= 400){
            return;
        }

		return (await response.json());
    }


    //Normal request
    const response = await requestUrl({
        method: method,
        url: url,
        body: body ? JSON.stringify(body) : null,
        headers: requestHeaders
    });

    if(response.status >= 400){
        return;
    }

    return (await response.json);
	
}
