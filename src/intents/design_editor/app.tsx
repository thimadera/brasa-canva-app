import { Button, Rows, Text } from "@canva/app-ui-kit";
import { requestExport } from "@canva/design";
import type { ExportCompleted } from "@canva/design";
import { requestOpenExternalUrl } from "@canva/platform";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";

const BACKEND_UPLOAD_URL = "https://admin.levebrasa.com/api/canva/export";

export const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openExternalUrl = async (url: string) => {
    await requestOpenExternalUrl({ url });
  };

  const intl = useIntl();

  const handleExportAndUpload = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const exportResult = (await requestExport({
        acceptedFileTypes: ["png"],
      })) as ExportCompleted;

      if (
        exportResult.status !== "completed" ||
        !exportResult.exportBlobs?.length
      ) {
        return;
      }

      const exportedBlob = exportResult.exportBlobs[0];

      const exportedFileUrl = exportedBlob?.url;

      if (exportedFileUrl?.includes(".zip")) {
        setErrorMessage("Selecione apenas uma página!");
        return;
      }

      const title = (exportResult.title || `CanvaDesign-${Date.now()}`).trim();

      const response = await fetch(BACKEND_UPLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          title,
          files: [{ url: exportedFileUrl, mimeType: "image/png" }],
        }),
      });

      if (response.ok) {
        await openExternalUrl(
          `https://mockup.levebrasa.com/internal/mockup?arte=${encodeURIComponent(title)}`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="Clique no botão abaixo para iniciar a exportação do design."
            description="Instructions for the app usage."
          />
        </Text>

        <Button
          variant="primary"
          onClick={handleExportAndUpload}
          stretch
          disabled={isLoading}
        >
          {isLoading
            ? intl.formatMessage({
                defaultMessage: "Aguarde...",
                description: "Loading message on button.",
              })
            : intl.formatMessage({
                defaultMessage: "Exportar Design",
                description:
                  "Button text to trigger the export and upload process.",
              })}
        </Button>

        {errorMessage && <Text tone="critical">{errorMessage}</Text>}
      </Rows>
    </div>
  );
};
