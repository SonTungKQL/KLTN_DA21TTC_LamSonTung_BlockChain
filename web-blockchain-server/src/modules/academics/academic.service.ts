import { AppError } from "../../http/error";
import { InstitutionService } from "../institutions/institution.service";
import { AcademicRepository } from "./academic.repository";

type CatalogInput = { institutionId: string; code: string; name: string };
type ClassInput = CatalogInput & { majorId: string; courseId: string };

export class AcademicService {
  constructor(
    private readonly repository = new AcademicRepository(),
    private readonly institutions = new InstitutionService(),
  ) {}

  listMajors(institutionId?: string) { return this.repository.listMajors(institutionId); }
  listCourses(institutionId?: string) { return this.repository.listCourses(institutionId); }
  listClasses(filter: { institutionId?: string; majorId?: string; courseId?: string }) { return this.repository.listClasses(filter); }

  async createMajor(input: CatalogInput) { await this.institutions.getRequired(input.institutionId); return this.repository.createMajor(input); }
  async updateMajor(id: string, input: CatalogInput) { await this.institutions.getRequired(input.institutionId); const item = await this.repository.updateMajor(id, input); if (!item) throw new AppError("Major not found", 404, "MAJOR_NOT_FOUND"); return item; }
  async getMajorRequired(id: string) { const item = await this.repository.findMajor(id); if (!item) throw new AppError("Major not found", 404, "MAJOR_NOT_FOUND"); return item; }

  async createCourse(input: CatalogInput & { startYear?: number }) { await this.institutions.getRequired(input.institutionId); return this.repository.createCourse(input); }
  async updateCourse(id: string, input: CatalogInput & { startYear?: number }) { await this.institutions.getRequired(input.institutionId); const item = await this.repository.updateCourse(id, input); if (!item) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND"); return item; }
  async getCourseRequired(id: string) { const item = await this.repository.findCourse(id); if (!item) throw new AppError("Course not found", 404, "COURSE_NOT_FOUND"); return item; }

  async createClass(input: ClassInput) { await this.validateClassRelation(input); return this.repository.createClass(input); }
  async updateClass(id: string, input: ClassInput) { await this.validateClassRelation(input); const item = await this.repository.updateClass(id, input); if (!item) throw new AppError("Class not found", 404, "CLASS_NOT_FOUND"); return item; }
  async getClassRequired(id: string) { const item = await this.repository.findClass(id); if (!item) throw new AppError("Class not found", 404, "CLASS_NOT_FOUND"); return item; }

  async resolveStudentAcademic(input: { institutionId: string; majorId: string; courseId: string; classId: string }) {
    const [institution, major, course, trainingClass] = await Promise.all([
      this.institutions.getRequired(input.institutionId),
      this.getMajorRequired(input.majorId),
      this.getCourseRequired(input.courseId),
      this.getClassRequired(input.classId),
    ]);
    const institutionId = institution._id.toString();
    if (major.institutionId.toString() !== institutionId || course.institutionId.toString() !== institutionId || trainingClass.institutionId.toString() !== institutionId || trainingClass.majorId.toString() !== major._id.toString() || trainingClass.courseId.toString() !== course._id.toString()) {
      throw new AppError("Academic data does not belong to the same institution, major and course", 422, "ACADEMIC_RELATION_INVALID");
    }
    return { institutionId: institution._id, majorId: major._id, courseId: course._id, classId: trainingClass._id, major: major.name, course: course.name, className: trainingClass.name };
  }

  private async validateClassRelation(input: ClassInput) {
    const [major, course] = await Promise.all([this.getMajorRequired(input.majorId), this.getCourseRequired(input.courseId)]);
    if (major.institutionId.toString() !== input.institutionId || course.institutionId.toString() !== input.institutionId) throw new AppError("Major and course must belong to the selected institution", 422, "ACADEMIC_RELATION_INVALID");
  }
}
