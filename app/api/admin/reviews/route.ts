import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/dbconfig/dbconn";
import Review from "@/models/review";
import CollegeStudent from "@/models/collegeStudent";
import { verifyAdminToken } from "@/lib/adminAuth";

// GET - Fetch all reviews with project details (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminPayload = await verifyAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    await connectDB();

    // Fetch all reviews and populate project details
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .lean();

    // Get project details for each review
    const reviewsWithProjects = await Promise.all(
      reviews.map(async (review) => {
        const project = await CollegeStudent.findById(review.projectId)
          .select("teamName segments")
          .lean();
        
        // Calculate average rating for this project
        const projectStats = await Review.aggregate([
          { $match: { projectId: review.projectId } },
          { $group: { _id: null, averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const averageRating = projectStats.length > 0 ? Math.round(projectStats[0].averageRating * 10) / 10 : 0;
        const reviewCount = projectStats.length > 0 ? projectStats[0].count : 0;

        return {
          ...review,
          projectName: (project as any)?.teamName || "Unknown Project",
          projectSegments: (project as any)?.segments || [],
          projectAverageRating: averageRating,
          projectReviewCount: reviewCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      reviews: reviewsWithProjects,
    });
  } catch (error: any) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete any review (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminPayload = await verifyAdminToken(request);
    if (!adminPayload) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review", details: error.message },
      { status: 500 }
    );
  }
}
