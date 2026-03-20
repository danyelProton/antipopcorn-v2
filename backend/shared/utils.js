export const addDays = function(date, days) {
  // setHours() is used for midnight
  const newDate1 = new Date(new Date(date).setHours(0, 0, 0, 0));
  const newDate2 = new Date(newDate1.setDate(newDate1.getDate() + days));
  return newDate2;
};


// async "wait" function 
export const asyncTimeout = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};


// retry mechanism - use to wrap function calls in the main function
// attempt 0 is the initial function call
export const withRetry = async function(fn, { maxAttempts = 3, delayMs = 1000, label = fn.name } = {}) {
  let lastError;
  for (let i = 0; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const delay = delayMs * (2 ** i);

      if (i < maxAttempts) {
        console.log(`ERROR - ${err.message}. Retry attempt ${i + 1}`);
        await asyncTimeout(delay);
      }
    }
  }
  console.log(`All attempts failed for '${label}'`);
  throw lastError;
};


// error logger
export function logError(stage, err, extra = {}) {
  console.error(JSON.stringify({
    level: 'error',
    stage,
    message: err.message,
    stack: err.stack,
    ...extra,
  }));
}