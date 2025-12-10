import { NextResponse } from "next/server";
import Dbconns from "@/dbconfig/dbconn";
import CollegeStudent from "@/models/collegeStudent";

export async function GET(request: Request) {
  try {
    await Dbconns();

    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment");

    // Build query - only show approved projects
    const matchStage: any = {
      registrationStatus: "approved",
    };

    if (segment) {
      matchStage.segments = { $in: [segment] };
    }

    const projects = await CollegeStudent.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "reviews",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$projectId", "$$pid"] }, hidden: false } },
            { $project: { rating: 1 } }
          ],
          as: "reviews"
        }
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          totalReviews: { $size: "$reviews" }
        }
      },
      {
        $project: {
          teamName: 1,
          projectSummary: 1,
          projectImage: 1,
          segments: 1,
          slotId: 1,
          roomNo: 1,
          teamMembers: 1,
          uuid: 1,
          _id: 1,
          averageRating: { $ifNull: [{ $round: ["$averageRating", 1] }, 0] },
          totalReviews: 1
        }
      },
      { $sort: { submittedAt: -1 } }
    ]);

    console.log('Projects API - Total found:', projects.length);
    if (projects.length > 0) {
      console.log('First project stats:', projects[0].averageRating, projects[0].totalReviews);
    }

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
