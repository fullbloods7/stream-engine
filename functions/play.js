const axios = require('axios');

exports.handler = async (event, context) => {
  // IMPROVED: Try to find the ID in two different ways
  let fileId = event.queryStringParameters.id;

  // If the query parameter failed, extract it directly from the URL path
  // Example path: "/play/jvydgJ8lRQHQ3X" -> We grab "jvydgJ8lRQHQ3X"
  if (!fileId) {
    const parts = event.path.split('/');
    fileId = parts[parts.length - 1]; 
  }

  // Debugging: If it still fails, print what we found (optional)
  if (!fileId) return { statusCode: 400, body: "No File ID found in path: " + event.path };

  const login = process.env.ST_LOGIN;
  const key = process.env.ST_KEY;

  try {
    // Step 1: Get Ticket
    const ticketUrl = `https://api.streamtape.com/file/dlticket?file=${fileId}&login=${login}&key=${key}`;
    const ticketRes = await axios.get(ticketUrl);
    const ticket = ticketRes.data.result?.ticket;
    
    if (!ticket) {
      // If we can't get a ticket, it usually means the Login/Key is wrong
      return { statusCode: 404, body: `Ticket Failed. Check ST_LOGIN/ST_KEY. Streamtape says: ${ticketRes.data.msg}` };
    }

    // Step 2: Get Final Link
    const dlUrl = `https://api.streamtape.com/file/dl?file=${fileId}&ticket=${ticket}`;
    const dlRes = await axios.get(dlUrl);
    const finalUrl = dlRes.data.result?.url;

    if (finalUrl) {
      return {
        statusCode: 302, // Redirect to the real video
        headers: { Location: finalUrl }
      };
    } else {
      return { statusCode: 404, body: "Link Generation Failed" };
    }

  } catch (error) {
    return { statusCode: 500, body: "Server Error: " + error.message };
  }
};
