import { google } from "googleapis";
import { storage } from "../storage";

// Helper to get OAuth client
export async function getOAuthClient(workspaceId: string) {
    const credentials = await storage.getGoogleOAuthCredentials(workspaceId);
    if (!credentials) {
        throw new Error("Google Calendar credentials not configured for this workspace");
    }

    return new google.auth.OAuth2(
        credentials.clientId,
        credentials.clientSecret,
        `${process.env.APP_URL || "http://localhost:7777"}/api/google-calendar/callback`
    );
}

export async function syncGoogleCalendar(userId: string, workspaceId: string) {
    console.log(`[Sync] Starting Google Calendar sync for user ${userId} in workspace ${workspaceId}`);

    const tokens = await storage.getGoogleCalendarTokens(userId);
    if (!tokens) {
        console.log(`[Sync] No tokens found for user ${userId}`);
        return;
    }

    const oauth2Client = await getOAuthClient(workspaceId);
    oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiryDate
    });

    // Handle token refresh if needed
    oauth2Client.on('tokens', async (newTokens) => {
        if (newTokens.access_token) {
            await storage.saveGoogleCalendarTokens({
                userId: userId,
                workspaceId: workspaceId,
                accessToken: newTokens.access_token,
                refreshToken: newTokens.refresh_token || tokens.refreshToken,
                expiryDate: newTokens.expiry_date || Date.now() + 3600 * 1000,
            });
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
    });

    const googleEvents = response.data.items || [];
    const googleEventIds = new Set(googleEvents.map(e => e.id).filter(id => !!id));

    // 1. Sync to Database (Upsert)
    for (const googleEvent of googleEvents) {
        if (!googleEvent.id) continue;

        const eventData = {
            workspaceId: workspaceId,
            googleEventId: googleEvent.id,
            title: googleEvent.summary || 'No Title',
            description: googleEvent.description || null,
            startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date || new Date()),
            endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date || new Date()),
            isAllDay: !googleEvent.start?.dateTime,
            location: googleEvent.location || null,
            isFromGoogle: true,
            color: "#DB4437" // Google Red
        };

        // Check if event exists
        const existingEvent = await storage.getEventByGoogleId(googleEvent.id);

        if (existingEvent) {
            await storage.updateEvent(existingEvent.id, eventData);
        } else {
            await storage.createEvent(eventData);
        }
    }

    // 2. Handle Deletions (Google -> LifeOS)
    // Fetch all local events that are from Google
    const allLocalEvents = await storage.getEvents(workspaceId);
    const localGoogleEvents = allLocalEvents.filter(e => e.isFromGoogle && e.googleEventId);

    for (const localEvent of localGoogleEvents) {
        if (localEvent.googleEventId && !googleEventIds.has(localEvent.googleEventId)) {
            // Event exists locally as Google event, but not in the fresh Google fetch
            // This means it was deleted on Google. Delete it locally.
            console.log(`[Sync] Deleting local event ${localEvent.id} because it was deleted on Google.`);
            await storage.deleteEvent(localEvent.id);
        }
    }

    return googleEvents.map(event => ({
        id: event.id,
        title: event.summary || 'No Title',
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        location: event.location,
        isAllDay: !event.start?.dateTime,
        isFromGoogle: true,
        googleEventId: event.id
    }));
}
