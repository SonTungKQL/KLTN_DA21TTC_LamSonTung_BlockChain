import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../http/response";
import { AcademicService } from "./academic.service";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const catalog = z.object({ institutionId: objectId, code: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()), name: z.string().trim().min(1).max(150) });
const course = catalog.extend({ startYear: z.coerce.number().int().min(1900).max(3000).optional() });
const trainingClass = catalog.extend({ majorId: objectId, courseId: objectId });

export class AcademicController {
  constructor(private readonly service = new AcademicService()) {}
  listMajors = async (request: Request, response: Response) => sendSuccess(response, await this.service.listMajors(z.object({ institutionId: objectId.optional() }).parse(request.query).institutionId));
  createMajor = async (request: Request, response: Response) => sendSuccess(response, await this.service.createMajor(catalog.parse(request.body)), 201);
  updateMajor = async (request: Request, response: Response) => sendSuccess(response, await this.service.updateMajor(objectId.parse(request.params.id), catalog.parse(request.body)));
  listCourses = async (request: Request, response: Response) => sendSuccess(response, await this.service.listCourses(z.object({ institutionId: objectId.optional() }).parse(request.query).institutionId));
  createCourse = async (request: Request, response: Response) => sendSuccess(response, await this.service.createCourse(course.parse(request.body)), 201);
  updateCourse = async (request: Request, response: Response) => sendSuccess(response, await this.service.updateCourse(objectId.parse(request.params.id), course.parse(request.body)));
  listClasses = async (request: Request, response: Response) => sendSuccess(response, await this.service.listClasses(z.object({ institutionId: objectId.optional(), majorId: objectId.optional(), courseId: objectId.optional() }).parse(request.query)));
  createClass = async (request: Request, response: Response) => sendSuccess(response, await this.service.createClass(trainingClass.parse(request.body)), 201);
  updateClass = async (request: Request, response: Response) => sendSuccess(response, await this.service.updateClass(objectId.parse(request.params.id), trainingClass.parse(request.body)));
}
