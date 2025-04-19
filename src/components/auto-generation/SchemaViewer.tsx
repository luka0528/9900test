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
  type: SchemaType | SchemaType[];
  properties?: Record<string, SchemaProperty>;
  items?: SchemaProperty;
  enum?: string[];
  pattern?: string;
  format?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  uniqueItems?: boolean;
}

export interface SchemaViewerProps {
  schema: Schema;
}

export const SchemaViewer = ({ schema }: SchemaViewerProps) => {
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

  const renderSchemaContent = (schema: Schema, isTopLevel = false) => {
    if (!schema) return null;

    // Handle single type schema without properties
    if (!schema.properties && schema.type) {
      // Handle top-level array schema first
      if (schema.type === "array" && schema.items) {
        return (
          <AccordionItem value="array" className="rounded-md border px-2">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-mono">
                  {isTopLevel ? "Schema" : "Array Items"}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  array
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                {/* Array constraints */}
                <div className="flex flex-wrap gap-2">
                  {schema.minItems !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      minItems: {schema.minItems}
                    </Badge>
                  )}
                  {schema.uniqueItems && (
                    <Badge variant="secondary" className="text-xs">
                      unique items
                    </Badge>
                  )}
                </div>
                {/* Items constraints */}
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

      // Handle other single type schemas
      return (
        <AccordionItem value="root" className="rounded-md border px-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {isTopLevel ? "Schema" : "Value"}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {schema.type}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-4">
              {schema.description && (
                <p className="text-sm text-muted-foreground">
                  {schema.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {schema.pattern && (
                  <Badge variant="secondary" className="text-xs">
                    pattern: {schema.pattern}
                  </Badge>
                )}
                {schema.format && (
                  <Badge variant="secondary" className="text-xs">
                    format: {schema.format}
                  </Badge>
                )}
                {schema.enum && (
                  <Badge variant="secondary" className="text-xs">
                    enum: [{schema.enum.join(", ")}]
                  </Badge>
                )}
                {schema.minimum !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    min: {schema.minimum}
                  </Badge>
                )}
                {schema.maximum !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    max: {schema.maximum}
                  </Badge>
                )}
                {schema.minItems !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    minItems: {schema.minItems}
                  </Badge>
                )}
                {schema.uniqueItems && (
                  <Badge variant="secondary" className="text-xs">
                    unique items
                  </Badge>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    }

    // Handle top-level object schema
    if (isTopLevel && schema.type === "object") {
      return (
        <AccordionItem value="root" className="rounded-md border px-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-mono">Schema</span>
              <Badge variant="outline" className="font-mono text-xs">
                object
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pl-4">
              <Accordion type="single" collapsible className="w-full space-y-2">
                {Object.entries(schema.properties ?? {}).map(
                  ([key, value]: [string, SchemaProperty]) => (
                    <AccordionItem
                      key={key}
                      value={key}
                      className="rounded-md border px-2"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{key}</span>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
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
                              {renderPropertyConstraints(value).map(
                                (constraint, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {constraint}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                          {/* Recursively render nested objects */}
                          {value.type === "object" && value.properties && (
                            <div className="mt-4">
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                              >
                                {renderSchemaContent(value)}
                              </Accordion>
                            </div>
                          )}
                          {/* Render array items schema */}
                          {value.type === "array" && value.items && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">
                                Array items:
                              </p>
                              <div className="mt-2">
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="w-full"
                                >
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
                )}
              </Accordion>
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    }

    return Object.entries(schema.properties ?? {}).map(
      ([key, value]: [string, SchemaProperty]) => (
        <AccordionItem key={key} value={key} className="rounded-md border px-2">
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
                    {renderSchemaContent(value)}
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
      {renderSchemaContent(schema, true)}
    </Accordion>
  );
};
