import { getAllAssets } from "../actions";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage() {
  const { data: assets } = await getAllAssets();

  return <AssetsClient assets={assets || []} />;
}
