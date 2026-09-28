import { isScalar, parseDocument, Scalar } from "yaml";
import type { Component } from "./versions.ts";

const imagePrefix = (component: Component): string =>
    `ghcr.io/eventail-scheduling/eventail-${component}:`;

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

export const chartImageTag = (values: string, component: Component): string =>
    String(findScalar(values, [component, "image", "tag"]).value);

export const setChartImageTag = (values: string, component: Component, version: string): string =>
    replaceScalar(values, [component, "image", "tag"], version);

export const setComposeImageTag = (
    compose: string,
    component: Component,
    version: string,
): string => {
    const current = String(findScalar(compose, ["services", component, "image"]).value);

    if (!current.startsWith(imagePrefix(component))) {
        throw new Error(`Unexpected ${component} image in the compose file: ${current}`);
    }

    return replaceScalar(
        compose,
        ["services", component, "image"],
        imagePrefix(component) + version,
    );
};
