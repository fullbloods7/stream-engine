const axios = require('axios');

exports.handler = async (event, context) => {
  const fileId = event.queryStringParameters.id;
  const login = process.env.ST_LOGIN;
  const key = process.env.ST_KEY;

  if (!fileId) return { statusCode: 400, body: "No File ID" };

  try {
    // Step 1: Get Ticket
    const ticketRes = await axios.get(`https://api.streamtape.com/file/dlticket?file=${fileId}&login=${login}&key=${key}`);
    const ticket = ticketRes.data.result?.ticket;
    
    if (!ticket) return { statusCode: 404, body: "Ticket Failed" };

    // Step 2: Get Final Link (Tokenized)
    // Streamtape sometimes wants a tiny delay, but usually instant works for API
    const dlRes = await axios.get(`https://api.streamtape.com/file/dl?file=${fileId}&ticket=${ticket}`);
    const finalUrl = dlRes.data.result?.url;

    if (finalUrl) {
      return {
        statusCode: 302, // Redirect
        headers: { Location: finalUrl }
      };
    } else {
      return { statusCode: 404, body: "Link Generation Failed" };
    }

  } catch (error) {
    return { statusCode: 500, body: "Server Error" };
  }
};