import { isScalar, parseDocument, Scalar } from "yaml";
import type { ImageName } from "./versions.ts";

const imagePrefix = (image: ImageName): string => `ghcr.io/eventail-scheduling/eventail-${image}:`;

const findScalar = (text: string, path: string[]): Scalar => {
    const node = parseDocument(text).getIn(path, true);

    if (!isScalar(node) || node.range === undefined || node.range === null) {
        throw new Error(`No scalar at ${path.join(".")}`);
    }

    return node;
};

const quote = (node: Scalar, value: string): string => {
    if (node.type === Scalar.QUOTE_DOUBLE) {
        return JSON.stringify(value);
    }

    if (node.type === Scalar.QUOTE_SINGLE) {
        return `'${value}'`;
    }

    return value;
};

/**
 * Splices over the scalar's source range, keeping every other character.
 *
 * The yaml library's own serializer reflows flow sequences. The new value
 * keeps the quoting style the old one had.
 */
const replaceScalar = (text: string, path: string[], value: string): string => {
    const node = findScalar(text, path);
    const [start, end] = node.range as [number, number, number];
    const replaced = text.slice(0, start) + quote(node, value) + text.slice(end);

    if (findScalar(replaced, path).value !== value) {
        throw new Error(`Replacing ${path.join(".")} did not take`);
    }

    return replaced;
};

export const chartImageTag = (values: string, image: ImageName): string =>
    String(findScalar(values, [image, "image", "tag"]).value);

export const setChartImageTag = (values: string, image: ImageName, version: string): string =>
    replaceScalar(values, [image, "image", "tag"], version);

/**
 * Records which release of the unit the chart deploys.
 *
 * release-please owns the chart's own `version` in the same file. The two
 * keys sit far enough apart that a release pull request and a bump pull
 * request do not land in each other's merge context.
 */
export const setChartAppVersion = (chart: string, version: string): string =>
    replaceScalar(chart, ["appVersion"], version);

export const setComposeImageTag = (compose: string, image: ImageName, version: string): string => {
    const current = String(findScalar(compose, ["services", image, "image"]).value);

    if (!current.startsWith(imagePrefix(image))) {
        throw new Error(`Unexpected ${image} image in the compose file: ${current}`);
    }

    return replaceScalar(compose, ["services", image, "image"], imagePrefix(image) + version);
};
