/**
 * The part of YAML that camera calibration files are written in.
 *
 * ROS `camera_info` files come out of yaml-cpp's emitter, PyYAML's `dump`, and people's editors, so
 * the reader accepts what those produce: block mappings, block and flow sequences, flow mappings,
 * plain and quoted scalars, comments, and a `%YAML` directive or `---` marker. It refuses what a
 * calibration never needs and a careless reader gets wrong -- anchors and aliases, tags, block
 * scalars, several documents in one file -- by name, rather than guessing.
 *
 * Hand-written for the same reason the profile validator is: a YAML library is larger than this whole
 * extension, and every extension that needs a camera loads this bundle.
 */
export type YamlValue = string | number | boolean | null | YamlValue[] | {
    [key: string]: YamlValue;
};
export declare class YamlError extends Error {
    readonly line: number;
    constructor(message: string, line: number);
}
export declare function parseYaml(source: string): YamlValue;
//# sourceMappingURL=yaml.d.ts.map