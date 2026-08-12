import * as ts from 'typescript';
export function resolvePluginOptionsForFile(options, sourceFile, compilerOptions) {
    return {
        ...options,
        esmCompatible: isEsmOutputFile(sourceFile, compilerOptions, options)
    };
}
export function isEsmOutputFile(sourceFile, compilerOptions, options) {
    if (options?.esmCompatibleWasConfigured) {
        return options.esmCompatible;
    }
    if (sourceFile.impliedNodeFormat !== undefined) {
        return sourceFile.impliedNodeFormat === ts.ModuleKind.ESNext;
    }
    const impliedNodeFormat = getImpliedNodeFormat(sourceFile, compilerOptions);
    if (impliedNodeFormat !== undefined) {
        return impliedNodeFormat === ts.ModuleKind.ESNext;
    }
    return isEsmModuleKind(compilerOptions.module);
}
function getImpliedNodeFormat(sourceFile, compilerOptions) {
    if (!isNodeModuleKind(compilerOptions.module)) {
        return undefined;
    }
    return ts.getImpliedNodeFormatForFile(sourceFile.fileName, undefined, ts.sys, compilerOptions);
}
function isEsmModuleKind(moduleKind) {
    if (moduleKind === undefined) {
        return false;
    }
    return ((moduleKind >= ts.ModuleKind.ES2015 &&
        moduleKind <= ts.ModuleKind.ESNext) ||
        moduleKind === ts.ModuleKind.Preserve);
}
function isNodeModuleKind(moduleKind) {
    return (moduleKind === ts.ModuleKind.Node16 ||
        moduleKind === ts.ModuleKind.Node18 ||
        moduleKind === ts.ModuleKind.Node20 ||
        moduleKind === ts.ModuleKind.NodeNext);
}
