"use client";

import React, { useState, useEffect, useMemo } from "react";
import StarRating from "../reviews/StarRating";

interface Review {
  _id: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  hidden?: boolean;
}

interface Project {
  _id: string;
  teamName: string;
  projectSummary: string;
  segments: string[];
  averageRating: number;
  reviewCount: number;
  latestReviews: {
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
}

export default function ReviewsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [strictFootfallEnabled, setStrictFootfallEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectReviews, setProjectReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [togglingReview, setTogglingReview] = useState<string | null>(null);

  // Global Stats State
  const [totalReviews, setTotalReviews] = useState(0);
  const [globalAverage, setGlobalAverage] = useState(0);
  const [uniqueReviewers, setUniqueReviewers] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchSettings();
    fetchGlobalStats();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        setStrictFootfallEnabled(data.settings.strictFootfallEnabled);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const response = await fetch("/api/admin/reviews");
      const data = await response.json();
      if (data.success) {
        const reviews = data.reviews as any[];
        setTotalReviews(reviews.length);
        setGlobalAverage(
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
        );
        setUniqueReviewers(new Set(reviews.map((r) => r.reviewerEmail)).size);
      }
    } catch (error) {
      console.error("Error fetching global stats:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/college-students");
      const data = await response.json();

      if (response.ok) {
        // Filter only projects that have reviews
        const reviewedProjects = data.students.filter((p: Project) => p.reviewCount > 0);
        setProjects(reviewedProjects);
      } else {
        console.error("Failed to fetch projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectReviews = async (projectId: string) => {
    try {
      setLoadingReviews(true);
      const response = await fetch(`/api/admin/reviews/project/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setProjectReviews(data.reviews);
      } else {
        console.error("Failed to fetch reviews:", data.error);
        setProjectReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setProjectReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchProjectReviews(selectedProject._id);
    } else {
      setProjectReviews([]);
    }
  }, [selectedProject]);

  const handleToggleStrictFootfall = async () => {
    try {
      const newValue = !strictFootfallEnabled;
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strictFootfallEnabled: newValue }),
      });
      const data = await response.json();
      if (data.success) {
        setStrictFootfallEnabled(newValue);
      } else {
        alert(data.error || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("An error occurred while updating settings");
    }
  };

  const handleToggleReviewVisibility = async (reviewId: string, currentHidden: boolean) => {
    try {
      setTogglingReview(reviewId);
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !currentHidden }),
      });
      const data = await response.json();
      if (data.success) {
        setProjectReviews(prev => prev.map(r => r._id === reviewId ? { ...r, hidden: !currentHidden } : r));
      } else {
        alert(data.error || "Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review visibility");
    } finally {
      setTogglingReview(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setProjectReviews(prev => prev.filter(r => r._id !== reviewId));
        // Refresh projects to update counts
        fetchProjects();
        fetchGlobalStats();
      } else {
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An error occurred while deleting the review");
    }
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return projects.filter(p => 
      p.teamName.toLowerCase().includes(query) ||
      p.projectSummary?.toLowerCase().includes(query) ||
      p.segments.some(s => s.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        <span className="ml-3 text-white/80">Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                Reviews Management
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Projects with Reviews: {projects.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 shadow-lg">
              <p className="text-xs text-white/70">Total Reviews</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-lg">{totalReviews}</p>
            </div>
          </div>
          
          {/* Strict Footfall Toggle */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Strict Footfall Verification</p>
              <p className="text-xs text-white/60 mt-0.5">
                {strictFootfallEnabled 
                  ? "Only approved visitors can review" 
                  : "Any logged-in user can review"}
              </p>
            </div>
            <button
              onClick={handleToggleStrictFootfall}
              disabled={loadingSettings}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                strictFootfallEnabled ? 'bg-green-500' : 'bg-gray-500'
              } ${loadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  strictFootfallEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by project name, summary, or segment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg md:rounded-xl border border-white/20 px-3 md:px-4 py-2 md:py-3 pl-10 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all text-sm md:text-base"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 text-center text-white/70 shadow-xl">
            {searchQuery
              ? "No projects match your search."
              : "No reviews found for any project."}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project._id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-white/10 bg-linear-to-br from-white/5 to-white/10">
                <h3 className="text-white font-semibold text-lg leading-tight mb-2 truncate">
                  {project.teamName}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={project.averageRating || 0} size="sm" />
                  <span className="text-sm font-bold text-yellow-400">
                    {(project.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs text-white/60">
                    ({project.reviewCount || 0} reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {project.segments.map((segment) => (
                    <span
                      key={segment}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Body - Latest Reviews */}
              <div className="p-5 flex-1">
                {project.latestReviews && project.latestReviews.length > 0 ? (
                  <div>
                    <p className="text-xs text-white/60 mb-2 font-medium">LATEST REVIEWS</p>
                    <div className="space-y-2">
                      {project.latestReviews.map((review, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-2 text-xs border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white truncate max-w-[100px]">{review.reviewerName}</span>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <p className="text-white/70 line-clamp-2 italic">"{review.comment}"</p>
                        </div>
                      ))}
                      {project.reviewCount > 2 && (
                        <p className="text-[10px] text-center text-white/40 italic">
                          + {project.reviewCount - 2} more reviews
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/50 italic">No reviews yet.</p>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="w-full px-3 py-2 bg-blue-500/20 backdrop-blur-sm text-white border border-blue-400/50 text-sm rounded-xl hover:bg-blue-500 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 font-medium"
                >
                  View All Reviews
                </button>
              </div>
            </div>
          ))
        )}
      </div>



      {/* Modal Overlay */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f172a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 sticky top-0 bg-white/10 backdrop-blur-md border-b border-white/20 px-4 sm:px-6 py-4 z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {selectedProject.teamName}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                      <StarRating rating={selectedProject.averageRating || 0} size="md" />
                      <span className="text-lg font-bold text-white">{selectedProject.averageRating || 0}</span>
                      <span className="text-xs text-white/60">({selectedProject.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="shrink-0 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center text-3xl transition-all"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
              {/* Reviews Section */}
              <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    All Reviews
                  </h3>
                  <span className="text-xs sm:text-sm px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full font-medium border border-purple-400/30">
                    {projectReviews.length} reviews
                  </span>
                </div>

                {loadingReviews ? (
                  <div className="text-center py-12 text-white/70">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                    Loading reviews...
                  </div>
                ) : projectReviews.length === 0 ? (
                  <div className="text-center py-12 text-white/70">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm">No reviews found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectReviews.map((review) => (
                      <div
                        key={review._id}
                        className={`border rounded-2xl p-4 ${
                          review.hidden 
                            ? "border-red-400/50 bg-red-500/10 backdrop-blur-sm" 
                            : "border-white/10 bg-white/5 backdrop-blur-sm"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <StarRating rating={review.rating} size="sm" />
                            <p className="mt-2 text-white font-semibold text-sm sm:text-base">{review.reviewerName}</p>
                            <p className="text-xs text-white/60 truncate">{review.reviewerEmail}</p>
                            <p className="text-xs text-white/50 mt-1">
                              {new Date(review.createdAt).toLocaleDateString()} 
                              {review.createdAt !== review.updatedAt && " (edited)"}
                            </p>
                            {review.hidden && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-red-500/30 text-red-200 border border-red-500/50">
                                🔒 Hidden from public
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleReviewVisibility(review._id, review.hidden || false)}
                              disabled={togglingReview === review._id}
                              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg transition font-medium ${
                                review.hidden
                                  ? "bg-green-500/20 text-green-200 hover:bg-green-500/30 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30"
                              } disabled:opacity-50`}
                            >
                              {togglingReview === review._id 
                                ? "..." 
                                : review.hidden ? "👁️ Show" : "🙈 Hide"
                              }
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition border border-red-500/30 font-medium"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed mt-3 border-t border-zinc-700/50 pt-3">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
