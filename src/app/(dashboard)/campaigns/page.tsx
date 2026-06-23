import { getProjects } from "../actions";
import { CampaignsClient } from "./campaigns-client";
import type { Project } from "@/types/database";

export default async function CampaignsPage() {
  const { data: projects } = await getProjects();
  const projectList = (projects as Project[]) ?? [];

  return <CampaignsClient projects={projectList} />;
}
