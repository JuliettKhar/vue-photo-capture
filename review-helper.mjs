import { Reviewer } from 'reviewer-lib';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not set');
  process.exit(1);
}

const reviewer = new Reviewer(apiKey);
let code = '';

process.stdin.on('data', chunk => {
  code += chunk;
});
process.stdin.on('end', () => {
  reviewer.submitCodeAssistanceMode(code)
    .then((feedback) => {
      console.log('Code Review Feedback:');
      console.log(feedback);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
});