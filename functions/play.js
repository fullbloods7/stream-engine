const axios = require('axios');

// Helper function to pause execution (Sleep)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async (event, context) => {
  let fileId = event.queryStringParameters.id;
  if (!fileId) {
    const parts = event.path.split('/');
    fileId = parts[parts.length - 1]; 
  }

  if (!fileId) return { statusCode: 400, body: "No File ID found" };

  const login = process.env.ST_LOGIN;
  const key = process.env.ST_KEY;

  try {
    // Step 1: Get Ticket
    const ticketRes = await axios.get(`https://api.streamtape.com/file/dlticket?file=${fileId}&login=${login}&key=${key}`);
    const ticketData = ticketRes.data.result;

    if (!ticketData || !ticketData.ticket) {
      return { statusCode: 404, body: "Ticket Failed: " + JSON.stringify(ticketRes.data) };
    }

    // CRITICAL FIX: Check if Streamtape wants us to wait
    const waitTime = ticketData.wait_time || 5; // Default to 5 seconds if not specified
    console.log(`Streamtape asked to wait ${waitTime} seconds...`);
    
    // Pause the script!
    await sleep(waitTime * 1000);

    // Step 2: Get Final Link (With "Fake Browser" Headers)
    const dlUrl = `https://api.streamtape.com/file/dl?file=${fileId}&ticket=${ticketData.ticket}`;
    
    const dlRes = await axios.get(dlUrl, {
      headers: {
        // Pretend to be Chrome on Android
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      }
    });

    const finalUrl = dlRes.data.result?.url;

    if (finalUrl) {
      return {
        statusCode: 302,
        headers: { Location: finalUrl }
      };
    } else {
      // If it still fails, print the error for debugging
      return { statusCode: 404, body: "Link Generation Failed. Streamtape Response: " + JSON.stringify(dlRes.data) };
    }

  } catch (error) {
    return { statusCode: 500, body: "Server Error: " + error.message };
  }
};
