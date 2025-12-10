import { NextResponse } from "next/server";
import Dbconns from "@/dbconfig/dbconn";
import CollegeStudent from "@/models/collegeStudent";

export async function GET() {
  try {
    await Dbconns();
    
    // Test the simpler aggregation pipeline
    const students = await CollegeStudent.aggregate([
      {
        $lookup: {
          from: "reviews",
          let: { pid: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$projectId", "$$pid"] } } },
            { $sort: { createdAt: -1 } }
          ],
          as: "allReviews"
        }
      },
      {
        $addFields: {
          reviewCount: { $size: "$allReviews" },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$allReviews" }, 0] },
              then: { $avg: "$allReviews.rating" },
              else: 0
            }
          },
          latestReviews: {
            $map: {
              input: { $slice: ["$allReviews", 2] },
              as: "review",
              in: {
                reviewerName: "$$review.reviewerName",
                rating: "$$review.rating",
                comment: "$$review.comment",
                createdAt: "$$review.createdAt"
              }
            }
          }
        }
      },
      { $match: { reviewCount: { $gt: 0 } } },
      { $limit: 3 }
    ]);
    
    return NextResponse.json({ 
      message: "Simplified aggregation test",
      count: students.length,
      students: students.map(s => ({
        _id: s._id,
        teamName: s.teamName,
        averageRating: s.averageRating,
        reviewCount: s.reviewCount,
        latestReviews: s.latestReviews
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
