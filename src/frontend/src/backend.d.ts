import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VideoInput {
    title: string;
    thumbnailUrl?: string;
    description: string;
    videoUrl: string;
}
export interface BlogPost {
    id: string;
    status: ApprovalStatus;
    title: string;
    content: string;
    coverImageId?: string;
    tags: Array<string>;
    publishedAt: Time;
    author: string;
}
export type Time = bigint;
export interface FileInput {
    title: string;
    description: string;
    fileSize: string;
    fileType: FileType;
    version?: string;
    category: string;
    fileUrl: string;
}
export interface BlogPostInput {
    title: string;
    content: string;
    coverImageId?: string;
    tags: Array<string>;
    author: string;
}
export interface BlogPostMetadata {
    id: string;
    title: string;
    publishedAt: Time;
    author: string;
}
export interface Subscription {
    id: string;
    subscribedAt: Time;
    email: string;
}
export interface FilePost {
    id: string;
    title: string;
    description: string;
    fileSize: string;
    fileType: FileType;
    version?: string;
    category: string;
    uploadedAt: Time;
    fileUrl: string;
}
export interface SiteConfiguration {
    email: string;
    address: string;
    phone: string;
    socialMedia: {
        linkedin: string;
        twitter: string;
        instagram: string;
        whatsapp: string;
        facebook: string;
        youtube: string;
    };
}
export interface VideoPost {
    id: string;
    title: string;
    thumbnailUrl?: string;
    description: string;
    videoUrl: string;
    uploadedAt: Time;
}
export interface UserProfile {
    name: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum FileType {
    APK = "APK",
    DOC = "DOC",
    EXE = "EXE",
    PDF = "PDF",
    TXT = "TXT",
    OTHER = "OTHER"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCalleeIceCandidate(code: string, candidate: string): Promise<void>;
    addCallerIceCandidate(code: string, candidate: string): Promise<void>;
    approveBlogPost(id: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAndPublishBlogPost(input: BlogPostInput): Promise<string>;
    createBlogPost(input: BlogPostInput): Promise<string>;
    createCallRoom(code: string): Promise<void>;
    createFile(input: FileInput): Promise<string>;
    createVideo(input: VideoInput): Promise<string>;
    deleteBlogPost(id: string): Promise<void>;
    deleteCallRoom(code: string): Promise<void>;
    deleteFile(id: string): Promise<void>;
    deleteSubscription(id: string): Promise<void>;
    deleteVideo(id: string): Promise<void>;
    getAllBlogPostMetadata(): Promise<Array<BlogPostMetadata>>;
    getAllBlogPostsAdmin(): Promise<Array<BlogPost>>;
    getAllFiles(): Promise<Array<FilePost>>;
    getAllSubscriptions(): Promise<Array<Subscription>>;
    getAllVideos(): Promise<Array<VideoPost>>;
    getAnswer(code: string): Promise<string | null>;
    getBlogPostById(id: string): Promise<BlogPost>;
    getBlogPostsByTag(tag: string): Promise<Array<BlogPostMetadata>>;
    getCalleeIceCandidates(code: string): Promise<Array<string>>;
    getCallerIceCandidates(code: string): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOffer(code: string): Promise<string | null>;
    getSiteConfiguration(): Promise<SiteConfiguration>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    rejectBlogPost(id: string): Promise<void>;
    roomExists(code: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAnswer(code: string, sdp: string): Promise<void>;
    setOffer(code: string, sdp: string): Promise<void>;
    subscribe(email: string): Promise<string>;
    updateBlogPost(id: string, input: BlogPostInput): Promise<void>;
    updateFile(id: string, input: FileInput): Promise<void>;
    updateSiteConfiguration(config: SiteConfiguration): Promise<void>;
    updateVideo(id: string, input: VideoInput): Promise<void>;
}
