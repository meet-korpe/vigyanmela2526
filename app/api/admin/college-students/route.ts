import { NextResponse } from "next/server";
import Dbconns from "@/dbconfig/dbconn";
import CollegeStudent from "@/models/collegeStudent";

function sanitize(doc: any) {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: obj?._id?.toString?.() ?? obj?._id ?? "",
    teamName: obj.teamName,
    projectSummary: obj.projectSummary,
    projectImage: obj.projectImage || null,
    teamSize: obj.teamSize,
    segments: Array.isArray(obj.segments) ? obj.segments : [],
    teamMembers: Array.isArray(obj.teamMembers)
      ? obj.teamMembers.map((m: any) => ({
          fullName: m.fullName,
          department: m.department,
          email: m.email,
          contactNumber: m.contactNumber,
          rollNumber: m.rollNumber,
          yearOfStudy: m.yearOfStudy,
          linkedinProfile: m.linkedinProfile || null,
        }))
      : [],
    slotId: obj.slotId || null,
    roomNo: obj.roomNo || null,
    registrationStatus: obj.registrationStatus ?? "pending",
    linkedinId: obj.linkedinId || null,
    submittedAt: obj.submittedAt ? new Date(obj.submittedAt).toISOString() : null,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    averageRating: typeof obj.averageRating === 'number' ? Math.round(obj.averageRating * 10) / 10 : 0,
    reviewCount: typeof obj.reviewCount === 'number' ? obj.reviewCount : 0,
    latestReviews: Array.isArray(obj.latestReviews) ? obj.latestReviews : [],
  };
}

export async function GET() {
  try {
    await Dbconns();
    // Use aggregation to join with reviews and calculate average rating
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
      {
        $project: {
          allReviews: 0
        }
      }
    ]);
    
    return NextResponse.json({ students: students.map(sanitize) }, { status: 200 });
  } catch (error) {
    console.error("Admin college students fetch error", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to load college registrations" },
      { status: 500 }
    );
  }
}