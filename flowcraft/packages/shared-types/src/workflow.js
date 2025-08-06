export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["ACTIVE"] = "ACTIVE";
    WorkflowStatus["PAUSED"] = "PAUSED";
    WorkflowStatus["ARCHIVED"] = "ARCHIVED";
})(WorkflowStatus || (WorkflowStatus = {}));
// ===== WORKFLOW EDITOR TYPES =====
export var NodeType;
(function (NodeType) {
    NodeType["START"] = "start";
    NodeType["END"] = "end";
    NodeType["ACTION"] = "action";
    NodeType["CONDITION"] = "condition";
    NodeType["LOOP"] = "loop";
    NodeType["HTTP_REQUEST"] = "http_request";
    NodeType["EMAIL"] = "email";
    NodeType["SLACK"] = "slack";
    NodeType["DATA_TRANSFORM"] = "data_transform";
    NodeType["TIMER"] = "timer";
    NodeType["WEBHOOK"] = "webhook";
    NodeType["TEST"] = "test";
})(NodeType || (NodeType = {}));
export var EdgeType;
(function (EdgeType) {
    EdgeType["DEFAULT"] = "default";
    EdgeType["CONDITIONAL"] = "conditional";
    EdgeType["LOOP"] = "loop";
})(EdgeType || (EdgeType = {}));
//# sourceMappingURL=workflow.js.map