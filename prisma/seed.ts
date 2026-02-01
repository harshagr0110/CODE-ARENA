import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questions = [
  // EASY QUESTIONS (10)
  { title: "Add Two Numbers", description: "Write a function that takes two numbers as input and returns their sum.", difficulty: "easy", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "5 3", expectedOutput: "8" }, { input: "10 20", expectedOutput: "30" }, { input: "0 0", expectedOutput: "0" }, { input: "-5 5", expectedOutput: "0" }, { input: "100 200", expectedOutput: "300" }]
  },
  { title: "Subtract Two Numbers", description: "Write a function that takes two numbers as input and returns their difference (first - second).", difficulty: "easy", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "10 3", expectedOutput: "7" }, { input: "20 5", expectedOutput: "15" }, { input: "0 0", expectedOutput: "0" }, { input: "5 10", expectedOutput: "-5" }, { input: "100 50", expectedOutput: "50" }]
  },
  { title: "Multiply Two Numbers", description: "Write a function that takes two numbers as input and returns their product.", difficulty: "easy", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "4 5", expectedOutput: "20" }, { input: "3 7", expectedOutput: "21" }, { input: "0 10", expectedOutput: "0" }, { input: "2 2", expectedOutput: "4" }, { input: "10 10", expectedOutput: "100" }]
  },
  { title: "Divide Two Numbers", description: "Write a function that takes two numbers as input and returns their quotient (rounded down).", difficulty: "easy", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "10 2", expectedOutput: "5" }, { input: "20 4", expectedOutput: "5" }, { input: "15 3", expectedOutput: "5" }, { input: "7 2", expectedOutput: "3" }, { input: "100 10", expectedOutput: "10" }]
  },
  { title: "Find Maximum", description: "Write a function that takes two numbers and returns the larger one.", difficulty: "easy", topics: ["Math", "Comparison"],
    testCases: [{ input: "5 10", expectedOutput: "10" }, { input: "20 15", expectedOutput: "20" }, { input: "0 0", expectedOutput: "0" }, { input: "-5 -10", expectedOutput: "-5" }, { input: "100 99", expectedOutput: "100" }]
  },
  { title: "Find Minimum", description: "Write a function that takes two numbers and returns the smaller one.", difficulty: "easy", topics: ["Math", "Comparison"],
    testCases: [{ input: "5 10", expectedOutput: "5" }, { input: "20 15", expectedOutput: "15" }, { input: "0 0", expectedOutput: "0" }, { input: "-5 -10", expectedOutput: "-10" }, { input: "100 99", expectedOutput: "99" }]
  },
  { title: "Calculate Average", description: "Write a function that takes two numbers and returns their average (rounded down).", difficulty: "easy", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "10 20", expectedOutput: "15" }, { input: "5 5", expectedOutput: "5" }, { input: "0 10", expectedOutput: "5" }, { input: "3 7", expectedOutput: "5" }, { input: "100 200", expectedOutput: "150" }]
  },
  { title: "Check Even or Odd", description: "Write a function that takes a number and returns 1 if it's even, 0 if it's odd.", difficulty: "easy", topics: ["Math", "Modulo"],
    testCases: [{ input: "4", expectedOutput: "1" }, { input: "7", expectedOutput: "0" }, { input: "0", expectedOutput: "1" }, { input: "15", expectedOutput: "0" }, { input: "100", expectedOutput: "1" }]
  },
  { title: "Absolute Difference", description: "Write a function that takes two numbers and returns the absolute difference between them.", difficulty: "easy", topics: ["Math", "Absolute Value"],
    testCases: [{ input: "10 3", expectedOutput: "7" }, { input: "3 10", expectedOutput: "7" }, { input: "5 5", expectedOutput: "0" }, { input: "-5 5", expectedOutput: "10" }, { input: "100 75", expectedOutput: "25" }]
  },
  { title: "Power of Two", description: "Write a function that takes a number n and returns 2 raised to the power of n.", difficulty: "easy", topics: ["Math", "Exponentiation"],
    testCases: [{ input: "3", expectedOutput: "8" }, { input: "0", expectedOutput: "1" }, { input: "1", expectedOutput: "2" }, { input: "4", expectedOutput: "16" }, { input: "5", expectedOutput: "32" }]
  },

  // MEDIUM QUESTIONS (12)
  { title: "Sum of Three Numbers", description: "Write a function that takes three numbers and returns their sum.", difficulty: "medium", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "5 10 15", expectedOutput: "30" }, { input: "1 2 3", expectedOutput: "6" }, { input: "0 0 0", expectedOutput: "0" }, { input: "-5 5 10", expectedOutput: "10" }, { input: "100 200 300", expectedOutput: "600" }]
  },
  { title: "Product of Three Numbers", description: "Write a function that takes three numbers and returns their product.", difficulty: "medium", topics: ["Math", "Basic Operations"],
    testCases: [{ input: "2 3 4", expectedOutput: "24" }, { input: "5 2 10", expectedOutput: "100" }, { input: "1 1 1", expectedOutput: "1" }, { input: "0 5 10", expectedOutput: "0" }, { input: "3 3 3", expectedOutput: "27" }]
  },
  { title: "Average of Three Numbers", description: "Write a function that takes three numbers and returns their average (rounded down).", difficulty: "medium", topics: ["Math", "Arrays"],
    testCases: [{ input: "10 20 30", expectedOutput: "20" }, { input: "5 5 5", expectedOutput: "5" }, { input: "0 10 20", expectedOutput: "10" }, { input: "3 6 9", expectedOutput: "6" }, { input: "100 200 300", expectedOutput: "200" }]
  },
  { title: "Find Maximum of Three", description: "Write a function that takes three numbers and returns the largest one.", difficulty: "medium", topics: ["Math", "Comparison", "Arrays"],
    testCases: [{ input: "5 10 3", expectedOutput: "10" }, { input: "20 15 25", expectedOutput: "25" }, { input: "0 0 0", expectedOutput: "0" }, { input: "-5 -10 -3", expectedOutput: "-3" }, { input: "100 99 101", expectedOutput: "101" }]
  },
  { title: "Calculate Rectangle Area", description: "Write a function that takes length and width and returns the area of a rectangle.", difficulty: "medium", topics: ["Math", "Geometry"],
    testCases: [{ input: "5 10", expectedOutput: "50" }, { input: "3 7", expectedOutput: "21" }, { input: "10 10", expectedOutput: "100" }, { input: "2 8", expectedOutput: "16" }, { input: "15 4", expectedOutput: "60" }]
  },
  { title: "Calculate Perimeter", description: "Write a function that takes length and width and returns the perimeter of a rectangle.", difficulty: "medium", topics: ["Math", "Geometry"],
    testCases: [{ input: "5 10", expectedOutput: "30" }, { input: "3 7", expectedOutput: "20" }, { input: "10 10", expectedOutput: "40" }, { input: "2 8", expectedOutput: "20" }, { input: "15 4", expectedOutput: "38" }]
  },
  { title: "Sum of Range", description: "Write a function that takes two numbers (start and end) and returns the sum of all integers from start to end.", difficulty: "medium", topics: ["Math", "Loops"],
    testCases: [{ input: "1 5", expectedOutput: "15" }, { input: "1 10", expectedOutput: "55" }, { input: "5 5", expectedOutput: "5" }, { input: "1 3", expectedOutput: "6" }, { input: "10 15", expectedOutput: "75" }]
  },
  { title: "Factorial", description: "Write a function that takes a number n and returns n factorial (n!).", difficulty: "medium", topics: ["Math", "Recursion", "Loops"],
    testCases: [{ input: "5", expectedOutput: "120" }, { input: "3", expectedOutput: "6" }, { input: "0", expectedOutput: "1" }, { input: "4", expectedOutput: "24" }, { input: "6", expectedOutput: "720" }]
  },
  { title: "Count Digits", description: "Write a function that takes a positive integer and returns the number of digits in it.", difficulty: "medium", topics: ["Math", "Strings"],
    testCases: [{ input: "12345", expectedOutput: "5" }, { input: "100", expectedOutput: "3" }, { input: "7", expectedOutput: "1" }, { input: "9999", expectedOutput: "4" }, { input: "1000000", expectedOutput: "7" }]
  },
  { title: "Reverse Number", description: "Write a function that takes a positive integer and returns it with digits reversed.", difficulty: "medium", topics: ["Math", "Strings"],
    testCases: [{ input: "123", expectedOutput: "321" }, { input: "1000", expectedOutput: "1" }, { input: "5", expectedOutput: "5" }, { input: "9876", expectedOutput: "6789" }, { input: "12321", expectedOutput: "12321" }]
  },
  { title: "Sum of Digits", description: "Write a function that takes a positive integer and returns the sum of its digits.", difficulty: "medium", topics: ["Math", "Strings", "Loops"],
    testCases: [{ input: "123", expectedOutput: "6" }, { input: "100", expectedOutput: "1" }, { input: "999", expectedOutput: "27" }, { input: "5", expectedOutput: "5" }, { input: "12345", expectedOutput: "15" }]
  },
  { title: "Power Function", description: "Write a function that takes two numbers (base and exponent) and returns base^exponent.", difficulty: "medium", topics: ["Math", "Exponentiation"],
    testCases: [{ input: "2 3", expectedOutput: "8" }, { input: "5 2", expectedOutput: "25" }, { input: "10 0", expectedOutput: "1" }, { input: "3 4", expectedOutput: "81" }, { input: "7 2", expectedOutput: "49" }]
  },

  // HARD QUESTIONS (12)
  { title: "Fibonacci Number", description: "Write a function that takes a number n and returns the nth Fibonacci number (0-indexed).", difficulty: "hard", topics: ["Dynamic Programming", "Recursion", "Math"],
    testCases: [{ input: "6", expectedOutput: "8" }, { input: "0", expectedOutput: "0" }, { input: "1", expectedOutput: "1" }, { input: "10", expectedOutput: "55" }, { input: "8", expectedOutput: "21" }]
  },
  { title: "GCD (Greatest Common Divisor)", description: "Write a function that takes two positive integers and returns their greatest common divisor.", difficulty: "hard", topics: ["Math", "Euclidean Algorithm"],
    testCases: [{ input: "48 18", expectedOutput: "6" }, { input: "100 50", expectedOutput: "50" }, { input: "17 19", expectedOutput: "1" }, { input: "24 36", expectedOutput: "12" }, { input: "7 7", expectedOutput: "7" }]
  },
  { title: "LCM (Least Common Multiple)", description: "Write a function that takes two positive integers and returns their least common multiple.", difficulty: "hard", topics: ["Math", "GCD"],
    testCases: [{ input: "4 6", expectedOutput: "12" }, { input: "3 5", expectedOutput: "15" }, { input: "10 15", expectedOutput: "30" }, { input: "7 7", expectedOutput: "7" }, { input: "12 18", expectedOutput: "36" }]
  },
  { title: "Prime Check", description: "Write a function that takes a positive integer and returns 1 if it's prime, 0 otherwise.", difficulty: "hard", topics: ["Math", "Prime Numbers"],
    testCases: [{ input: "7", expectedOutput: "1" }, { input: "1", expectedOutput: "0" }, { input: "2", expectedOutput: "1" }, { input: "10", expectedOutput: "0" }, { input: "17", expectedOutput: "1" }]
  },
  { title: "Count Prime Numbers", description: "Write a function that takes a number n and returns the count of prime numbers less than n.", difficulty: "hard", topics: ["Math", "Prime Numbers", "Sieve"],
    testCases: [{ input: "10", expectedOutput: "4" }, { input: "20", expectedOutput: "8" }, { input: "2", expectedOutput: "0" }, { input: "5", expectedOutput: "2" }, { input: "30", expectedOutput: "10" }]
  },
  { title: "Binary to Decimal", description: "Write a function that takes a binary number (as integer) and returns its decimal equivalent.", difficulty: "hard", topics: ["Math", "Binary", "Bit Manipulation"],
    testCases: [{ input: "101", expectedOutput: "5" }, { input: "1010", expectedOutput: "10" }, { input: "1", expectedOutput: "1" }, { input: "1111", expectedOutput: "15" }, { input: "10000", expectedOutput: "16" }]
  },
  { title: "Decimal to Binary", description: "Write a function that takes a decimal number and returns its binary representation (as integer).", difficulty: "hard", topics: ["Math", "Binary", "Bit Manipulation"],
    testCases: [{ input: "5", expectedOutput: "101" }, { input: "10", expectedOutput: "1010" }, { input: "1", expectedOutput: "1" }, { input: "15", expectedOutput: "1111" }, { input: "16", expectedOutput: "10000" }]
  },
  { title: "Armstrong Number", description: "Write a function that takes a number and returns 1 if it's an Armstrong number, 0 otherwise. (Sum of cubes of digits equals the number)", difficulty: "hard", topics: ["Math", "Loops"],
    testCases: [{ input: "153", expectedOutput: "1" }, { input: "370", expectedOutput: "1" }, { input: "9", expectedOutput: "1" }, { input: "100", expectedOutput: "0" }, { input: "407", expectedOutput: "1" }]
  },
  { title: "Perfect Number", description: "Write a function that takes a positive integer and returns 1 if it's a perfect number (sum of divisors equals the number), 0 otherwise.", difficulty: "hard", topics: ["Math", "Number Theory"],
    testCases: [{ input: "6", expectedOutput: "1" }, { input: "28", expectedOutput: "1" }, { input: "12", expectedOutput: "0" }, { input: "1", expectedOutput: "0" }, { input: "496", expectedOutput: "1" }]
  },
  { title: "Collatz Sequence Length", description: "Write a function that takes a number n and returns the length of its Collatz sequence (n → n/2 if even, n → 3n+1 if odd, until reaching 1).", difficulty: "hard", topics: ["Math", "Sequences"],
    testCases: [{ input: "10", expectedOutput: "7" }, { input: "1", expectedOutput: "1" }, { input: "3", expectedOutput: "8" }, { input: "6", expectedOutput: "9" }, { input: "27", expectedOutput: "112" }]
  },
  { title: "Sum of Multiples", description: "Write a function that takes a number n and returns the sum of all multiples of 3 or 5 below n.", difficulty: "hard", topics: ["Math", "Loops"],
    testCases: [{ input: "10", expectedOutput: "23" }, { input: "20", expectedOutput: "78" }, { input: "5", expectedOutput: "3" }, { input: "15", expectedOutput: "45" }, { input: "100", expectedOutput: "2318" }]
  },
  { title: "Product of Array", description: "Write a function that takes 5 space-separated numbers and returns their product.", difficulty: "hard", topics: ["Arrays", "Math"],
    testCases: [{ input: "2 3 4 5 1", expectedOutput: "120" }, { input: "1 1 1 1 1", expectedOutput: "1" }, { input: "0 5 10 2 3", expectedOutput: "0" }, { input: "2 2 2 2 2", expectedOutput: "32" }, { input: "10 1 2 5 2", expectedOutput: "200" }]
  },

  // MORE EASY QUESTIONS
  { title: "String Length", description: "Write a function that takes a string and returns its length.", difficulty: "easy", topics: ["Strings", "Basic Operations"],
    testCases: [{ input: "hello", expectedOutput: "5" }, { input: "world", expectedOutput: "5" }, { input: "a", expectedOutput: "1" }, { input: "test", expectedOutput: "4" }, { input: "programming", expectedOutput: "11" }]
  },
  { title: "Celsius to Fahrenheit", description: "Write a function that converts Celsius to Fahrenheit. Formula: F = (C * 9/5) + 32 (round down).", difficulty: "easy", topics: ["Math", "Conversion"],
    testCases: [{ input: "0", expectedOutput: "32" }, { input: "100", expectedOutput: "212" }, { input: "25", expectedOutput: "77" }, { input: "-40", expectedOutput: "-40" }, { input: "37", expectedOutput: "98" }]
  },
  { title: "Is Positive", description: "Write a function that takes a number and returns 1 if it's positive, 0 otherwise.", difficulty: "easy", topics: ["Math", "Comparison"],
    testCases: [{ input: "5", expectedOutput: "1" }, { input: "-3", expectedOutput: "0" }, { input: "0", expectedOutput: "0" }, { input: "100", expectedOutput: "1" }, { input: "-1", expectedOutput: "0" }]
  },
  { title: "Count Vowels", description: "Write a function that takes a string and returns the count of vowels (a, e, i, o, u) in it.", difficulty: "easy", topics: ["Strings", "Loops"],
    testCases: [{ input: "hello", expectedOutput: "2" }, { input: "world", expectedOutput: "1" }, { input: "aeiou", expectedOutput: "5" }, { input: "xyz", expectedOutput: "0" }, { input: "beautiful", expectedOutput: "5" }]
  },
  { title: "Simple Interest", description: "Write a function that takes principal, rate, and time, returns simple interest (P*R*T/100, rounded down).", difficulty: "easy", topics: ["Math", "Finance"],
    testCases: [{ input: "1000 5 2", expectedOutput: "100" }, { input: "5000 10 1", expectedOutput: "500" }, { input: "2000 7 3", expectedOutput: "420" }, { input: "10000 3 5", expectedOutput: "1500" }, { input: "500 12 2", expectedOutput: "120" }]
  },

  // MORE MEDIUM QUESTIONS
  { title: "Palindrome Check", description: "Write a function that takes a string and returns 1 if it's a palindrome, 0 otherwise.", difficulty: "medium", topics: ["Strings", "Two Pointers"],
    testCases: [{ input: "racecar", expectedOutput: "1" }, { input: "hello", expectedOutput: "0" }, { input: "level", expectedOutput: "1" }, { input: "world", expectedOutput: "0" }, { input: "noon", expectedOutput: "1" }]
  },
  { title: "Array Sum", description: "Write a function that takes 5 space-separated numbers and returns their sum.", difficulty: "medium", topics: ["Arrays", "Math"],
    testCases: [{ input: "1 2 3 4 5", expectedOutput: "15" }, { input: "10 20 30 40 50", expectedOutput: "150" }, { input: "0 0 0 0 0", expectedOutput: "0" }, { input: "-5 5 10 -10 20", expectedOutput: "20" }, { input: "100 200 300 400 500", expectedOutput: "1500" }]
  },
  { title: "Find Median", description: "Write a function that takes 3 space-separated numbers and returns the median (middle value).", difficulty: "medium", topics: ["Arrays", "Sorting"],
    testCases: [{ input: "5 2 8", expectedOutput: "5" }, { input: "10 20 15", expectedOutput: "15" }, { input: "3 3 3", expectedOutput: "3" }, { input: "1 5 3", expectedOutput: "3" }, { input: "100 50 75", expectedOutput: "75" }]
  },
  { title: "Reverse String", description: "Write a function that takes a string and returns it reversed.", difficulty: "medium", topics: ["Strings", "Arrays"],
    testCases: [{ input: "hello", expectedOutput: "olleh" }, { input: "world", expectedOutput: "dlrow" }, { input: "a", expectedOutput: "a" }, { input: "test", expectedOutput: "tset" }, { input: "programming", expectedOutput: "gnimmargorp" }]
  },
  { title: "Square Root (Floor)", description: "Write a function that takes a positive integer and returns the floor of its square root.", difficulty: "medium", topics: ["Math", "Binary Search"],
    testCases: [{ input: "16", expectedOutput: "4" }, { input: "20", expectedOutput: "4" }, { input: "1", expectedOutput: "1" }, { input: "100", expectedOutput: "10" }, { input: "50", expectedOutput: "7" }]
  },
  { title: "Count Consonants", description: "Write a function that takes a string and returns the count of consonants (non-vowel letters).", difficulty: "medium", topics: ["Strings", "Loops"],
    testCases: [{ input: "hello", expectedOutput: "3" }, { input: "world", expectedOutput: "4" }, { input: "aeiou", expectedOutput: "0" }, { input: "xyz", expectedOutput: "3" }, { input: "programming", expectedOutput: "7" }]
  },
  { title: "Leap Year Check", description: "Write a function that takes a year and returns 1 if it's a leap year, 0 otherwise.", difficulty: "medium", topics: ["Math", "Logic"],
    testCases: [{ input: "2020", expectedOutput: "1" }, { input: "2021", expectedOutput: "0" }, { input: "2000", expectedOutput: "1" }, { input: "1900", expectedOutput: "0" }, { input: "2024", expectedOutput: "1" }]
  },
  { title: "Second Largest", description: "Write a function that takes 4 space-separated numbers and returns the second largest.", difficulty: "medium", topics: ["Arrays", "Sorting"],
    testCases: [{ input: "10 20 30 15", expectedOutput: "20" }, { input: "5 2 8 3", expectedOutput: "5" }, { input: "100 50 75 90", expectedOutput: "90" }, { input: "1 1 2 3", expectedOutput: "2" }, { input: "40 30 50 45", expectedOutput: "45" }]
  },

  // MORE HARD QUESTIONS
  { title: "Longest Substring Without Repeating", description: "Write a function that takes a string and returns the length of the longest substring without repeating characters.", difficulty: "hard", topics: ["Strings", "Sliding Window", "Hash Map"],
    testCases: [{ input: "abcabcbb", expectedOutput: "3" }, { input: "bbbbb", expectedOutput: "1" }, { input: "pwwkew", expectedOutput: "3" }, { input: "abcdef", expectedOutput: "6" }, { input: "aab", expectedOutput: "2" }]
  },
  { title: "Two Sum", description: "Write a function that takes 6 numbers (target, then 5 array elements) and returns 1 if any two elements sum to target, 0 otherwise.", difficulty: "hard", topics: ["Arrays", "Hash Map", "Two Pointers"],
    testCases: [{ input: "9 2 7 11 15 6", expectedOutput: "1" }, { input: "10 1 2 3 4 5", expectedOutput: "0" }, { input: "15 7 8 3 12 5", expectedOutput: "1" }, { input: "20 5 5 10 10 5", expectedOutput: "1" }, { input: "100 10 20 30 40 50", expectedOutput: "0" }]
  },
  { title: "Valid Parentheses", description: "Write a function that takes a string of parentheses and returns 1 if they are balanced, 0 otherwise.", difficulty: "hard", topics: ["Strings", "Stack"],
    testCases: [{ input: "()", expectedOutput: "1" }, { input: "(())", expectedOutput: "1" }, { input: "(()", expectedOutput: "0" }, { input: "())", expectedOutput: "0" }, { input: "()()", expectedOutput: "1" }]
  },
  { title: "Anagram Check", description: "Write a function that takes two space-separated strings and returns 1 if they are anagrams, 0 otherwise.", difficulty: "hard", topics: ["Strings", "Sorting", "Hash Map"],
    testCases: [{ input: "listen silent", expectedOutput: "1" }, { input: "hello world", expectedOutput: "0" }, { input: "evil live", expectedOutput: "1" }, { input: "test tset", expectedOutput: "1" }, { input: "abc def", expectedOutput: "0" }]
  },
  { title: "Pascal's Triangle Row", description: "Write a function that takes a row number n (0-indexed) and returns the sum of all elements in that row of Pascal's triangle.", difficulty: "hard", topics: ["Math", "Dynamic Programming", "Arrays"],
    testCases: [{ input: "0", expectedOutput: "1" }, { input: "1", expectedOutput: "2" }, { input: "2", expectedOutput: "4" }, { input: "3", expectedOutput: "8" }, { input: "4", expectedOutput: "16" }]
  },
  { title: "Find Missing Number", description: "Write a function that takes 5 space-separated numbers (0 to 5 with one missing) and returns the missing number.", difficulty: "hard", topics: ["Arrays", "Math", "XOR"],
    testCases: [{ input: "0 1 2 3 5", expectedOutput: "4" }, { input: "1 2 3 4 5", expectedOutput: "0" }, { input: "0 1 3 4 5", expectedOutput: "2" }, { input: "0 2 3 4 5", expectedOutput: "1" }, { input: "0 1 2 4 5", expectedOutput: "3" }]
  },
  { title: "Max Consecutive Ones", description: "Write a function that takes a 10-digit binary string and returns the maximum number of consecutive 1s.", difficulty: "hard", topics: ["Arrays", "Strings", "Two Pointers"],
    testCases: [{ input: "1101110011", expectedOutput: "3" }, { input: "1111100000", expectedOutput: "5" }, { input: "0000000000", expectedOutput: "0" }, { input: "1010101010", expectedOutput: "1" }, { input: "1111111111", expectedOutput: "10" }]
  },
  { title: "Rotate Array", description: "Write a function that takes k and 5 space-separated numbers, returns the element at index 0 after rotating array right by k positions.", difficulty: "hard", topics: ["Arrays", "Rotation"],
    testCases: [{ input: "2 1 2 3 4 5", expectedOutput: "4" }, { input: "3 1 2 3 4 5", expectedOutput: "3" }, { input: "1 1 2 3 4 5", expectedOutput: "5" }, { input: "5 1 2 3 4 5", expectedOutput: "1" }, { input: "0 1 2 3 4 5", expectedOutput: "1" }]
  },
  { title: "Count Set Bits", description: "Write a function that takes a positive integer and returns the count of 1s in its binary representation.", difficulty: "hard", topics: ["Bit Manipulation", "Math"],
    testCases: [{ input: "7", expectedOutput: "3" }, { input: "15", expectedOutput: "4" }, { input: "1", expectedOutput: "1" }, { input: "31", expectedOutput: "5" }, { input: "128", expectedOutput: "1" }]
  },
  { title: "Single Number", description: "Write a function that takes 5 space-separated numbers where every element appears twice except one, returns the single number.", difficulty: "hard", topics: ["Arrays", "XOR", "Bit Manipulation"],
    testCases: [{ input: "2 3 2 1 1", expectedOutput: "3" }, { input: "4 1 2 1 2", expectedOutput: "4" }, { input: "1 1 5 5 9", expectedOutput: "9" }, { input: "7 3 7 8 8", expectedOutput: "3" }, { input: "10 10 15 20 20", expectedOutput: "15" }]
  }
]

async function main() {
  
  let user = await prisma.user.findFirst()
  
  if (!user) {
    // Create a test user for seeding purposes
    user = await prisma.user.create({
      data: {
        id: 'seed-user-00000000-0000-0000-0000-000000000000',
        clerkId: 'seed-clerk-user',
        username: 'seed-user',
        email: 'seed@example.com',
      }
    })
  } else {
  }

  await prisma.question.deleteMany({
    where: {
      title: {
        in: questions.map(q => q.title)
      }
    }
  })

  for (const q of questions) {
    const question = await prisma.question.create({
      data: ({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        // Cast to any to avoid client type mismatch if Prisma Client isn't regenerated yet
        topics: q.topics,
        testCases: q.testCases,
        createdBy: user.id
      } as any)
    })
  }

}

main()
  .catch((e) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
