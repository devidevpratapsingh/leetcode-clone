import {
  getJudge0LanguageId,
  isJudge0Configured,
  pollBatchResults,
  submitBatch,
} from "@/lib/judge0";
import { currentUserRole, getCurrentUser } from "@/modules/auth/actions";

import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function POST(request) {
  try {
    const userRole = await currentUserRole();
    const user = await getCurrentUser();

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can create problems" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User account not found. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testCases,
      codeSnippets,
      referenceSolutions,
    } = body;

    // Basic validation
    if (!title || !description || !difficulty || !testCases || !codeSnippets || !referenceSolutions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate test cases
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: "At least one test case is required" },
        { status: 400 }
      );
    }

    // Validate reference solutions
    if (!referenceSolutions || typeof referenceSolutions !== 'object') {
      return NextResponse.json(
        { error: "Reference solutions must be provided for all supported languages" },
        { status: 400 }
      );
    }

    if (isJudge0Configured()) {
      for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
        const languageId = getJudge0LanguageId(language);
        if (!languageId) {
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
        }

        const submissions = testCases.map(({ input, output }) => ({
          source_code: solutionCode,
          language_id: languageId,
          stdin: input,
          expected_output: output,
        }));

        const submissionResults = await submitBatch(submissions);
        const tokens = submissionResults.map((res) => res.token);
        const results = await pollBatchResults(tokens);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];

          if (result.status.id !== 3) {
            return NextResponse.json(
              {
                error: `Validation failed for ${language}`,
                testCase: {
                  input: submissions[i].stdin,
                  expectedOutput: submissions[i].expected_output,
                  actualOutput: result.stdout,
                  error: result.stderr || result.compile_output,
                },
                details: result,
              },
              { status: 400 }
            );
          }
        }
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error:
            "Judge0 is not configured. Set JUDGE0_API_URL, RAPIDAPI_KEY, and RAPIDAPI_HOST.",
        },
        { status: 503 }
      );
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolutions,
        userId: user.id,
      },
    });

    revalidatePath("/problems");

    return NextResponse.json(
      {
        success: true,
        message: "Problem created successfully",
        data: newProblem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating problem:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create problem" },
      { status: 500 }
    );
  }
}
