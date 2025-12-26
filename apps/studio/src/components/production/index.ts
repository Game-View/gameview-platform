/**
 * Production Components
 *
 * Components for creating and managing video-to-3D productions.
 *
 * Terminology:
 * - Production: A video-to-3D processing job
 * - Scene: A single 3D environment
 * - Experience: A published collection of scenes
 */

export { NewProductionModal } from "./NewProductionModal";
export { SparkGuide, SPARK_GUIDE_CONTENT } from "./SparkGuide";
export { TutorialOverlay, PRODUCTION_TUTORIAL_STEPS } from "./TutorialOverlay";
export {
  ProductionProgressCard,
  ProductionProgressList,
  type Production,
  type ProductionStage,
} from "./ProductionProgressCard";
