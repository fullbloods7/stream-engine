const axios = require('axios');

exports.handler = async (event, context) => {
  // Use the environment variable for your Gist URL
  const textFileUrl = process.env.MY_TEXT_FILE; 

  if (!textFileUrl) {
    return { statusCode: 500, body: "Error: MY_TEXT_FILE environment variable not set in Netlify." };
  }

  try {
    const response = await axios.get(textFileUrl);
    const lines = response.data.split('\n');
    const siteUrl = process.env.URL; // Netlify provides this automatically

    let m3u8Content = "#EXTM3U\n";

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Regex to find the ID from /v/ or /e/ links
      const match = trimmed.match(/streamtape\.com\/[ve]\/([a-zA-Z0-9]+)/);
      
      if (match && match[1]) {
        const id = match[1];
        // Create a nice name (optional logic)
        const name = trimmed.split('/').pop() || `Video ${id}`;
        
        m3u8Content += `#EXTINF:-1, ${name}\n`;
        // This points to YOUR Netlify app, not Streamtape directly
        m3u8Content += `${siteUrl}/play/${id}\n`; 
      }
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*" // Allow playing anywhere
      },
      body: m3u8Content
    };

  } catch (error) {
    return { statusCode: 500, body: "Error fetching list: " + error.message };
  }
};