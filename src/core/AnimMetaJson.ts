interface AnimMetaJsonOptions {
    exportTimestamp: string;
    bodyType: string;
    standardAnimations: {
        exported: string[];
        failed: string[];
    };
    customAnimations: {
        exported: string[];
        failed: string[];
    };
    frameSize: number;
    frameCounts: { [key: string]: number };
}

export class AnimMetaJson {
    exportTimestamp: string;
    bodyType: string;
    standardAnimations: {
        exported: string[];
        failed: string[];
    };
    customAnimations: {
        exported: string[];
        failed: string[];
    };
    frameSize: number;
    frameCounts: { [key: string]: number };

    constructor(options: AnimMetaJsonOptions) {
        this.exportTimestamp = options.exportTimestamp;
        this.bodyType = options.bodyType;
        this.standardAnimations = options.standardAnimations;
        this.customAnimations = options.customAnimations;
        this.frameSize = options.frameSize;
        this.frameCounts = options.frameCounts;
    }

    getAllExportedAnimations(): string[] {
        return [
            ...this.standardAnimations.exported,
           // ...this.customAnimations.exported
        ];
    }

    getFrameCount(animationName: string): number | undefined {
        return this.frameCounts[animationName];
    }
}
