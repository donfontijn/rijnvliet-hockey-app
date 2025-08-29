import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { action, data } = req.body;
      
      switch (action) {
        case 'syncPlayers':
          await syncPlayersToNotion(data.players);
          break;
        case 'syncMatches':
          await syncMatchesToNotion(data.matches);
          break;
        case 'syncPlayerPerformance':
          await syncPlayerPerformanceToNotion(data.performance);
          break;
        case 'getPlayers':
          const players = await getPlayersFromNotion();
          return res.json(players);
        case 'getMatches':
          const matches = await getMatchesFromNotion();
          return res.json(matches);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Notion API error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function syncPlayersToNotion(players) {
  // Clear existing entries first (optional)
  try {
    for (const player of players) {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_TEAM_DB },
        properties: {
          'Name': { title: [{ text: { content: player.name } }] },
          'Personal Notes': { rich_text: [{ text: { content: player.personalNotes || '' } }] },
          'Color': { rich_text: [{ text: { content: player.color } }] },
          'Checkbox': { checkbox: true }
        }
      });
    }
  } catch (error) {
    console.error('Error syncing players:', error);
    throw error;
  }
}

async function syncMatchesToNotion(matches) {
  try {
    for (const match of matches) {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_MATCHES_DB },
        properties: {
          'Match': { title: [{ text: { content: `${match.date} vs ${match.opponent}` } }] },
          'Date': { date: { start: match.date } },
          'Opponent': { rich_text: [{ text: { content: match.opponent } }] },
          'Our Score': { number: match.ourScore },
          'Their Score': { number: match.theirScore },
          'Formation Used': { rich_text: [{ text: { content: match.formation || '' } }] },
          'General Notes': { rich_text: [{ text: { content: match.generalNotes || '' } }] }
        }
      });
    }
  } catch (error) {
    console.error('Error syncing matches:', error);
    throw error;
  }
}

async function syncPlayerPerformanceToNotion(performance) {
  try {
    for (const entry of performance) {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_PERFORMANCE_DB },
        properties: {
          'Entry': { title: [{ text: { content: `${entry.playerName} - ${entry.matchDate}` } }] },
          'Player': { rich_text: [{ text: { content: entry.playerName } }] },
          'Match': { rich_text: [{ text: { content: entry.matchDate } }] },
          'Performance Notes': { rich_text: [{ text: { content: entry.notes || '' } }] }
        }
      });
    }
  } catch (error) {
    console.error('Error syncing performance:', error);
    throw error;
  }
}

async function getPlayersFromNotion() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_TEAM_DB,
    });
    
    return response.results.map(page => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.text?.content || '',
      personalNotes: page.properties['Personal Notes']?.rich_text?.[0]?.text?.content || '',
      color: page.properties.Color?.rich_text?.[0]?.text?.content || '#3b82f6',
    }));
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
}

async function getMatchesFromNotion() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_MATCHES_DB,
    });
    
    return response.results.map(page => ({
      id: page.id,
      date: page.properties.Date?.date?.start || '',
      opponent: page.properties.Opponent?.rich_text?.[0]?.text?.content || '',
      ourScore: page.properties['Our Score']?.number || null,
      theirScore: page.properties['Their Score']?.number || null,
      formation: page.properties['Formation Used']?.rich_text?.[0]?.text?.content || '',
      generalNotes: page.properties['General Notes']?.rich_text?.[0]?.text?.content || ''
    }));
  } catch (error) {
    console.error('Error getting matches:', error);
    throw error;
  }
}