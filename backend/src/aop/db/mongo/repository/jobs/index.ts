import { ClientSession, Db, ObjectId } from 'mongodb';

import { ResourceNotFoundException, SchemaValidationException } from 'aop/exceptions';
import { DatabaseOperationFailedException } from 'aop/exceptions/errors/database';
import { parseSchema } from 'lib/validation';

import config from '../../config';

import { ErrorMessage } from 'shared/enums/error-messages';

import type { CreateJobPayload, UpdateJobPayload } from './types';
import type { Job, JobDocument } from 'shared/types/jobs';
import type { ExecutionPayload } from 'shared/types/jobs/tools/execution/types-execution';

import { deleteJobResultSchema, jobDocumentSchema } from 'shared/schemas/jobs';

/**
 * JobRepository encapsulates persistence logic for job execution records.
 */
class JobRepository {
    private readonly db: Db;
    private readonly collectionName: string;

    constructor(db: Db) {
        this.db = db;
        this.collectionName = config.db.collection.jobs.name;
    }

    /**
     * Gets a job with the id from the job document.
     * @param jobDocument The job document to get the job with the id from.
     * @returns The job with the id from the job document.
     */
    private getJobWithNormalizedId(jobDocument: JobDocument): Job {
        const { _id, ...rest } = jobDocument;
        return {
            id: _id.toString(),
            ...rest,
        };
    }

    /**
     * Persists a new job execution record.
     *
     * Note: No schema validation is performed here because insertOne does not return
     * the document — the response is built from the already-validated in-memory
     * payload. Document integrity is verified on read via {@link getById}.
     *
     * @param payload Job data to store
     * @param session Optional Mongo session for transactional contexts
     * @returns The created job document
     */
    async create(payload: CreateJobPayload, session?: ClientSession): Promise<Job> {
        const jobDocument: JobDocument = {
            _id: new ObjectId(),
            ...payload,
        };

        const createdJobDocument = await this.db
            .collection<JobDocument>(this.collectionName)
            .insertOne(jobDocument, { session });

        if (!createdJobDocument.acknowledged) {
            throw new DatabaseOperationFailedException(ErrorMessage.DATABASE_OPERATION_FAILED_ERROR);
        }

        const schemaResult = parseSchema(jobDocumentSchema, jobDocument);

        if (!schemaResult.success) {
            throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: schemaResult.issues });
        }

        return this.getJobWithNormalizedId(schemaResult.data);
    }

    /**
     * Updates an existing cron job document by ID.
     *
     * @param payload The update payload including id and userId for ownership verification
     * @param session Optional Mongo session for transactional contexts
     * @throws ResourceNotFoundException if cron job not found or user doesn't own it
     * @throws SchemaValidationException if schema validation fails
     * @returns Promise resolving to MongoDB's UpdateResult
     */
    async update(payload: UpdateJobPayload, session?: ClientSession): Promise<Job> {
        const { id, userId, name, schedule, tools, updatedAt } = payload;

        const updateResult = await this.db.collection<JobDocument>(this.collectionName).findOneAndUpdate(
            { _id: new ObjectId(id), userId },
            { $set: { name, schedule, tools, updatedAt } },
            {
                returnDocument: 'after',
                ...(session ? { session } : {}),
            }
        );

        if (!updateResult) {
            throw new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE);
        }

        const schemaResult = parseSchema(jobDocumentSchema, updateResult);

        if (!schemaResult.success) {
            throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: schemaResult.issues });
        }

        return this.getJobWithNormalizedId(schemaResult.data);
    }

    /**
     * Adds an execution to a job document.
     * @param payload Execution data to add
     * @param session Optional Mongo session for transactional contexts
     * @throws ResourceNotFoundException if resource is not found
     * @throws SchemaValidationException if schema validation fails
     * @returns The updated job document
     */
    async addExecution(payload: ExecutionPayload, session?: ClientSession): Promise<Job> {
        const { jobId, ...executions } = payload;

        const executionResult = await this.db.collection<JobDocument>(this.collectionName).findOneAndUpdate(
            { _id: new ObjectId(jobId) },
            { $push: { executions } },
            {
                returnDocument: 'after',
                ...(session ? { session } : {}),
            }
        );

        if (!executionResult) {
            throw new ResourceNotFoundException(ErrorMessage.JOBS_FAILED_TO_ADD_EXECUTION);
        }

        const schemaResult = parseSchema(jobDocumentSchema, executionResult);

        if (!schemaResult.success) {
            throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: schemaResult.issues });
        }

        return this.getJobWithNormalizedId(schemaResult.data);
    }

    /**
     * Deletes a job document by ID.
     *
     * @param id The job ID to delete
     * @param userId The user ID for ownership verification
     * @param session Optional Mongo session for transactional contexts
     * @returns Promise resolving to MongoDB's DeleteResult
     * @throws ResourceNotFoundException if job not found or user doesn't own it
     */
    async delete(id: string, userId: string, session?: ClientSession): Promise<{ id: string }> {
        const deleteResult = await this.db
            .collection<JobDocument>(this.collectionName)
            .deleteOne({ _id: new ObjectId(id), userId }, { ...(session ? { session } : {}) });

        if (deleteResult.deletedCount === 0) {
            throw new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE);
        }

        const deletedJobResult = {
            id,
        };

        const schemaResult = parseSchema(deleteJobResultSchema, deletedJobResult);

        if (!schemaResult.success) {
            throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: schemaResult.issues });
        }

        return schemaResult.data;
    }

    /**
     * Retrieves a job document by ID.
     *
     * @param id The job ID to search for
     * @param userId The user ID for ownership verification
     * @returns Promise resolving to the job document if found
     * @throws ResourceNotFoundException if job not found or user doesn't own it
     */
    async getById(id: string, userId: string): Promise<Job> {
        const jobDocument = await this.db
            .collection<JobDocument>(this.collectionName)
            .findOne({ _id: new ObjectId(id), userId });

        if (!jobDocument) {
            throw new ResourceNotFoundException(ErrorMessage.JOBS_NOT_FOUND_IN_DATABASE);
        }

        // Normalize the job document
        const schemaResult = parseSchema(jobDocumentSchema, jobDocument);

        if (!schemaResult.success) {
            throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: schemaResult.issues });
        }

        return this.getJobWithNormalizedId(schemaResult.data);
    }

    /**
     * Retrieves all jobs for a user with pagination.
     *
     * @param userId The user ID to filter jobs by
     * @param limit Maximum number of jobs to return
     * @param offset Number of jobs to skip
     * @returns Promise resolving to array of job documents
     */
    async getAllByUserId(userId: string, limit: number, offset: number): Promise<Job[]> {
        const jobDocuments = await this.db
            .collection<JobDocument>(this.collectionName)
            .find({ userId })
            .skip(offset)
            .limit(limit)
            .toArray();

        const mappedJobs = [];

        for (const jobDocument of jobDocuments) {
            const result = parseSchema(jobDocumentSchema, jobDocument);

            if (!result.success) {
                throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: result.issues });
            }

            mappedJobs.push(this.getJobWithNormalizedId(result.data));
        }

        return mappedJobs;
    }

    /**
     * Retrieves all jobs for system operations (e.g., server initialization, rescheduling).
     * This method is NOT user-scoped and should only be used for system-level operations.
     *
     * @param limit Maximum number of jobs to return (0 for unlimited)
     * @param offset Number of jobs to skip
     * @returns Promise resolving to array of job documents
     */
    async getAll(limit: number, offset: number): Promise<Job[]> {
        const query = this.db.collection<JobDocument>(this.collectionName).find().skip(offset);

        const jobDocuments = limit > 0 ? await query.limit(limit).toArray() : await query.toArray();

        const mappedJobs = [];

        for (const jobDocument of jobDocuments) {
            const result = parseSchema(jobDocumentSchema, jobDocument);

            if (!result.success) {
                throw new SchemaValidationException(ErrorMessage.SCHEMA_VALIDATION_FAILED, { issues: result.issues });
            }

            mappedJobs.push(this.getJobWithNormalizedId(result.data));
        }

        return mappedJobs;
    }
}

export { JobRepository };
