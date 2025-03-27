import * as React from "react";
import nutrient from "@nutrient-sdk/viewer";

export interface INutrientViewerProps {
    documentBase64: string;
    viewerHeight: number;
    viewerWidth: number;
    onSave: (pdfBase64: string) => void;
}

const convertBase64ToArrayBuffer = (base64String: string): ArrayBuffer => {
    try {
        const rawBase64 = base64String.includes(",") ? base64String.split(",")[1] : base64String;
        const binaryString = window.atob(rawBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (error) {
        console.error("Error converting Base64 to ArrayBuffer:", error);
        return new ArrayBuffer(0);
    }
};

const convertArrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    try {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch (error) {
        console.error("Error converting ArrayBuffer to Base64:", error);
        return "";
    }
};

const NutrientViewerComponent: React.FC<INutrientViewerProps> = ({ documentBase64, viewerHeight, viewerWidth, onSave }) => {
    const divRef = React.useRef<HTMLDivElement>(null);
    const [instance, setInstance] = React.useState<any>(null);

    React.useEffect(() => {
        const loadNutrientViewer = async () => {
            if (!divRef.current) return;
            console.log(instance);
            // Unload nutrient if documentBase64 is empty
            if (!documentBase64) {
                if (instance) {
                    console.log("Unloading NutrientViewer due to empty document.");
                    nutrient.unload(divRef.current);
                    console.log("NutrientViewer Unloaded");
                    setInstance(null);
                }
                return;
            }

            try {
                // Unload previous instance before loading a new one
                if (instance) {
                    console.log("Unloading previous NutrientViewer instance.");
                    nutrient.unload(divRef.current);
                    console.log("NutrientViewer Unloaded");
                }

                console.log("Loading NutrientViewer with new document...");
                const newInstance = await nutrient.load({
                    disableWebAssemblyStreaming: true,
                    baseUrl: "https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.1.0/",
                    container: divRef.current,
                    document: convertBase64ToArrayBuffer(documentBase64),
                });

                setInstance(newInstance);

                // Add Save button
                newInstance.setToolbarItems((items: any) => [
                    ...items,
                    {
                        type: "custom",
                        id: "btnSavePdf",
                        title: "Save",
                        onPress: async () => {
                            try {
                                const pdfBuffer = await newInstance.exportPDF();
                                onSave(convertArrayBufferToBase64(pdfBuffer));
                            } catch (error) {
                                console.error("Error exporting PDF:", error);
                            }
                        }
                    }
                ]);
            } catch (error) {
                console.error("Error loading NutrientViewer:", error);
            }
        };
        loadNutrientViewer();
        // Cleanup function to unload NutrientViewer when the component unmounts or document changes
        return () => {
            if (instance && divRef.current) {
                console.log("Cleaning up NutrientViewer instance...");
                nutrient.unload(divRef.current);
                setInstance(null);
                console.log("NutrientViewer instance has been cleaned up.");
            }
        };
    }, [documentBase64]); // Reload only when documentBase64 changes
    return (
        <div
            ref={divRef}
            className="NutrientViewer-container"
            style={{
                height: `${viewerHeight}px`,
                width: `${viewerWidth}px`,
                backgroundColor: "green",
            }}
        />
    );
};

export default NutrientViewerComponent;