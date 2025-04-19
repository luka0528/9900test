import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";

type SchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

type SchemaProperty = {
  type: SchemaType | SchemaType[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  uniqueItems?: boolean;
  pattern?: string;
  format?: string;
  enum?: string[];
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
};

interface Schema {
  type: SchemaType;
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  enum?: string[];
}

export interface SchemaViewerProps {
  schema: Schema;
}

export const SchemaViewer = ({ schema }: SchemaViewerProps) => {
  const renderSchemaContent = (schema: Schema) => {
    if (!schema) return null;

    // Handle top-level array schema
    if (schema.type === "array" && schema.items) {
      return (
        <AccordionItem value="array">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-mono">Array Items</span>
              <Badge variant="outline" className="font-mono text-xs">
                {schema.items.type}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-4">
              {schema.items.enum && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    enum: [{schema.items.enum.join(", ")}]
                  </Badge>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    }

    const renderPropertyConstraints = (property: SchemaProperty) => {
      const constraints = [];

      if (property.minimum !== undefined) {
        constraints.push(`min: ${property.minimum}`);
      }
      if (property.maximum !== undefined) {
        constraints.push(`max: ${property.maximum}`);
      }
      if (property.minItems !== undefined) {
        constraints.push(`minItems: ${property.minItems}`);
      }
      if (property.uniqueItems) {
        constraints.push("unique items");
      }
      if (property.pattern) {
        constraints.push(`pattern: ${property.pattern}`);
      }
      if (property.format) {
        constraints.push(`format: ${property.format}`);
      }
      if (property.enum) {
        constraints.push(`enum: [${property.enum.join(", ")}]`);
      }

      return constraints;
    };

    return Object.entries(schema.properties ?? {}).map(
      ([key, value]: [string, SchemaProperty]) => (
        <AccordionItem key={key} value={key}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-mono">{key}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {Array.isArray(value.type)
                  ? value.type.join(" | ")
                  : value.type}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-4">
              {value.description && (
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              )}

              {/* Display constraints */}
              {renderPropertyConstraints(value).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {renderPropertyConstraints(value).map((constraint, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {constraint}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Recursively render nested objects */}
              {value.type === "object" && value.properties && (
                <div className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    {renderSchemaContent({
                      type: "object",
                      properties: value.properties,
                    })}
                  </Accordion>
                </div>
              )}

              {/* Render array items schema */}
              {value.type === "array" && value.items && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Array items:</p>
                  <div className="mt-2">
                    <Accordion type="single" collapsible className="w-full">
                      {renderSchemaContent({
                        type: "object",
                        properties: { items: value.items },
                      })}
                    </Accordion>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ),
    );
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {renderSchemaContent(schema)}
    </Accordion>
  );
};
