const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com'

interface Judge0Submission {
  source_code: string
  language_id: number
  stdin?: string
  cpu_time_limit?: number
  memory_limit?: number
}

interface Judge0Response {
  token: string
}

interface Judge0Result {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  status: {
    id: number
    description: string
  }
  time: string
  memory: number
}

interface TestCase {
  input: string
  expectedOutput: string
  explanation?: string
}

interface ExecutionResult {
  isCorrect: boolean
  feedback: string
  executionTime: number
  testResults: Array<{
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
  }>
}

const LANGUAGE_MAP = {
  javascript: { id: 63, name: 'JavaScript (Node.js 18.15.0)' },
  python: { id: 71, name: 'Python (3.8.1)' },
  cpp: { id: 54, name: 'C++ (GCC 9.2.0)' },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  c: { id: 50, name: 'C (GCC 9.2.0)' },
}

// Simple input sanitization
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

// Better C++ code wrapper
function wrapCppCode(code: string): string {
  // Don't modify the code if it has main function defined
  if (code.includes('main()') || code.includes('main(')) {
    return code;
  }
  
  // Simple wrapper for code fragments
  return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    ${code}
    return 0;
}`;
}

// Better error message handling
function getErrorMessage(status: any, stderr: string | null, compileOutput: string | null): string {
  if (status.id === 3) {
    return 'Accepted' // Successful execution
  }
  if (status.id === 4) {
    return 'Wrong Answer: Your output does not match the expected result.'
  }
  if (status.id === 5) {
    return 'Time Limit Exceeded: Your code took too long to execute. Try optimizing your algorithm.'
  }
  if (status.id === 6) {
    return 'Memory Limit Exceeded: Your code used too much memory. Try using more efficient data structures.'
  }
  if (status.id === 7) {
    return 'Runtime Error: Your program crashed. Check for array bounds, null pointers, or infinite loops.'
  }
  if (status.id === 8) {
    return 'Compilation Error: Your code has syntax errors. Please check your code and try again.'
  }
  
  if (stderr) {
    return stderr.trim()
  }
  if (compileOutput) {
    return compileOutput.trim()
  }
  
  return `Execution Error: ${status.description}`
}

// Submit code to Judge0
async function submitCode(code: string, languageId: number, input: string): Promise<string> {
  const apiKey = process.env.RAPIDAPI_KEY
  
  if (!apiKey) {
    throw new Error('RapidAPI key is not configured. Please add RAPIDAPI_KEY to your environment variables.')
  }

  const submission: Judge0Submission = {
    source_code: code,
    language_id: languageId,
    stdin: input,
    cpu_time_limit: 20, // Reduced to 20 seconds to comply with Judge0 API
    memory_limit: 512000,
  }


  
  const response = await fetch(`${JUDGE0_API_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
    body: JSON.stringify(submission),
  })


  if (response.status === 403) {
    throw new Error('Authentication failed. Please check your RapidAPI key. Make sure you have subscribed to Judge0 CE API.')
  }
  
  if (response.status === 401) {
    throw new Error('Unauthorized. Please check your RapidAPI key configuration.')
  }
  
  if (response.status === 422) {
    const errorBody = await response.text();
    throw new Error(`Judge0 API validation error (422): ${errorBody.substring(0, 200)}...`);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Judge0 API error: ${response.status} - ${response.statusText}`)
  }

  const data: Judge0Response = await response.json()
  return data.token
}

// Get results from Judge0
async function getResults(token: string): Promise<Judge0Result> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    throw new Error('RapidAPI key is not configured. Please add RAPIDAPI_KEY to your environment variables.')
  }

  const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
    },
  })

  if (response.status === 403) {
    throw new Error('Authentication failed. Please check your RapidAPI key. Make sure you have subscribed to Judge0 CE API.')
  }
  
  if (response.status === 401) {
    throw new Error('Unauthorized. Please check your RapidAPI key configuration.')
  }

  if (!response.ok) {
    throw new Error(`Judge0 API error: ${response.status} - ${response.statusText}`)
  }

  return await response.json()
}

// Wait for results with polling
async function waitForResults(token: string, maxAttempts: number = 30): Promise<Judge0Result> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getResults(token)
    
    
    // Status 1 = In Queue, Status 2 = Processing
    // Status 3 = Accepted, Status 4+ = Various errors
    if (result.status.id !== 1 && result.status.id !== 2) {
      return result
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  throw new Error('Execution timeout - Judge0 took too long to process the submission. Possible causes: Judge0 API is slow, quota exceeded, or code is taking too long. Check your RapidAPI quota and try again.')
}

export async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<ExecutionResult> {
  const langConfig = LANGUAGE_MAP[language as keyof typeof LANGUAGE_MAP]
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`)
  }

  // Check if API key is configured
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    throw new Error('RapidAPI key is not configured. Please add RAPIDAPI_KEY to your .env.local file and restart the server.')
  }

  const testResults = []
  let allPassed = true
  let totalExecutionTime = 0

  for (const testCase of testCases) {
    try {
      const startTime = Date.now()
      
      // Sanitize input
      const cleanInput = sanitizeInput(testCase.input || '')
      
      // Wrap C++ code
      let executionCode = code
      if (language === 'cpp') {
        executionCode = wrapCppCode(code)
      }
      
      // Submit code
      const token = await submitCode(executionCode, langConfig.id, cleanInput)
      
      // Wait for results
  const result = await waitForResults(token, 60)
      
      const endTime = Date.now()
      totalExecutionTime += (endTime - startTime)
      
      const actualOutput = result.stdout?.trim() || ''
      const expectedOutput = testCase.expectedOutput.trim()
      let passed = actualOutput === expectedOutput
      let finalOutput = actualOutput

      if (result.status.id === 3) { // Accepted
        // Code executed successfully, check if output matches
        if (actualOutput !== expectedOutput) {
          allPassed = false
          passed = false
          finalOutput = `Wrong Answer: Expected "${expectedOutput}" but got "${actualOutput}"`
        }
      } else if (result.status.id === 4) { // Wrong Answer
        allPassed = false
        passed = false
        finalOutput = `Wrong Answer: ${result.stderr || result.compile_output || 'Output does not match expected result'}`
      } else if (result.status.id === 5) { // Time Limit Exceeded
        allPassed = false
        passed = false
        finalOutput = 'Time Limit Exceeded: Your code took too long to execute.'
      } else if (result.status.id === 6) { // Memory Limit Exceeded
        allPassed = false
        passed = false
        finalOutput = 'Memory Limit Exceeded: Your code used too much memory.'
      } else if (result.status.id === 7) { // Runtime Error
        allPassed = false
        passed = false
        finalOutput = `Runtime Error: ${result.stderr || result.compile_output || 'Program crashed during execution'}`
      } else if (result.status.id === 8) { // Compilation Error
        allPassed = false
        passed = false
        finalOutput = `Compilation Error: ${result.compile_output || result.stderr || 'Code has syntax errors'}`
      } else {
        allPassed = false
        passed = false
        finalOutput = getErrorMessage(result.status, result.stderr, result.compile_output)
      }

      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: finalOutput,
        passed,
      })

      if (!passed) {
        allPassed = false
      }

    } catch (error) {
      allPassed = false
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      testResults.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: `Execution Error: ${errorMessage}`,
        passed: false,
      })
    }
  }

  const passedTests = testResults.filter(result => result.passed).length
  const totalTests = testResults.length

  let feedback = ''
  if (allPassed) {
    feedback = `All ${totalTests} test cases passed!`
  } else {
    feedback = `${passedTests}/${totalTests} test cases passed.`
  }

  return {
    isCorrect: allPassed,
    feedback,
    executionTime: Math.round(totalExecutionTime / testCases.length),
    testResults,
  }
}

export async function getPistonLanguages() {
  try {
    const response = await fetch(`${JUDGE0_API_URL}/languages`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
    })
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    return []
  }
}