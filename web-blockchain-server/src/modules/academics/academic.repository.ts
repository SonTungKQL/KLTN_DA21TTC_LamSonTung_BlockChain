import { CourseModel, MajorModel, TrainingClassModel } from "./academic.model";

export class AcademicRepository {
  listMajors(institutionId?: string) {
    return MajorModel.find(institutionId ? { institutionId } : {}).sort({ name: 1 }).exec();
  }
  findMajor(id: string) { return MajorModel.findById(id).exec(); }
  createMajor(input: Record<string, unknown>) { return MajorModel.create(input); }
  updateMajor(id: string, input: Record<string, unknown>) { return MajorModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec(); }

  listCourses(institutionId?: string) {
    return CourseModel.find(institutionId ? { institutionId } : {}).sort({ startYear: -1, name: 1 }).exec();
  }
  findCourse(id: string) { return CourseModel.findById(id).exec(); }
  createCourse(input: Record<string, unknown>) { return CourseModel.create(input); }
  updateCourse(id: string, input: Record<string, unknown>) { return CourseModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec(); }

  listClasses(filter: { institutionId?: string; majorId?: string; courseId?: string }) {
    return TrainingClassModel.find(filter).sort({ name: 1 }).exec();
  }
  findClass(id: string) { return TrainingClassModel.findById(id).exec(); }
  createClass(input: Record<string, unknown>) { return TrainingClassModel.create(input); }
  updateClass(id: string, input: Record<string, unknown>) { return TrainingClassModel.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec(); }
}
