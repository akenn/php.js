/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 15.6.2012 
* @website http://hertzen.com
 */


var PHP = function( tokens, opts ) {
    
    //console.log( tokens );
    this.AST = new PHP.Parser( tokens );
  
    //console.log( this.AST );
    //console.log( opts );
    this.compiler = new PHP.Compiler( this.AST );
    console.log(this.compiler.src);
    this.vm = new PHP.VM( this.compiler.src, opts );
    

    
};

PHP.Constants = {};

PHP.Modules = function() {
    this.OUTPUT_BUFFER = "";
    

};

PHP.Adapters = {};

PHP.Utils = {};


PHP.Utils.$A = function( arr) {
    return Array.prototype.slice.call( arr ); 
};

PHP.Utils.Merge = function(obj1, obj2) {
    
    Object.keys( obj2 ).forEach(function( key ){
        obj1[ key ] = obj2 [ key ]; 
    });
    
    return obj1;
};

PHP.Utils.Path = function( path ) {
    
    path = path.substring(0, path.lastIndexOf("/"));
    
    return path;
};

PHP.Utils.TokenName = function( token ) {
    var constants = ["T_INCLUDE","T_INCLUDE_ONCE","T_EVAL","T_REQUIRE","T_REQUIRE_ONCE","T_LOGICAL_OR","T_LOGICAL_XOR","T_LOGICAL_AND","T_PRINT","T_PLUS_EQUAL","T_MINUS_EQUAL","T_MUL_EQUAL","T_DIV_EQUAL","T_CONCAT_EQUAL","T_MOD_EQUAL","T_AND_EQUAL","T_OR_EQUAL","T_XOR_EQUAL","T_SL_EQUAL","T_SR_EQUAL","T_BOOLEAN_OR","T_BOOLEAN_AND","T_IS_EQUAL","T_IS_NOT_EQUAL","T_IS_IDENTICAL","T_IS_NOT_IDENTICAL","T_IS_SMALLER_OR_EQUAL","T_IS_GREATER_OR_EQUAL","T_SL","T_SR","T_INSTANCEOF","T_INC","T_DEC","T_INT_CAST","T_DOUBLE_CAST","T_STRING_CAST","T_ARRAY_CAST","T_OBJECT_CAST","T_BOOL_CAST","T_UNSET_CAST","T_NEW","T_CLONE","T_EXIT","T_IF","T_ELSEIF","T_ELSE","T_ENDIF","T_LNUMBER","T_DNUMBER","T_STRING","T_STRING_VARNAME","T_VARIABLE","T_NUM_STRING","T_INLINE_HTML","T_CHARACTER","T_BAD_CHARACTER","T_ENCAPSED_AND_WHITESPACE","T_CONSTANT_ENCAPSED_STRING","T_ECHO","T_DO","T_WHILE","T_ENDWHILE","T_FOR","T_ENDFOR","T_FOREACH","T_ENDFOREACH","T_DECLARE","T_ENDDECLARE","T_AS","T_SWITCH","T_ENDSWITCH","T_CASE","T_DEFAULT","T_BREAK","T_CONTINUE","T_GOTO","T_FUNCTION","T_CONST","T_RETURN","T_TRY","T_CATCH","T_THROW","T_USE","T_INSTEADOF","T_GLOBAL","T_STATIC","T_ABSTRACT","T_FINAL","T_PRIVATE","T_PROTECTED","T_PUBLIC","T_VAR","T_UNSET","T_ISSET","T_EMPTY","T_HALT_COMPILER","T_CLASS","T_TRAIT","T_INTERFACE","T_EXTENDS","T_IMPLEMENTS","T_OBJECT_OPERATOR","T_DOUBLE_ARROW","T_LIST","T_ARRAY","T_CALLABLE","T_CLASS_C","T_TRAIT_C","T_METHOD_C","T_FUNC_C","T_LINE","T_FILE","T_COMMENT","T_DOC_COMMENT","T_OPEN_TAG","T_OPEN_TAG_WITH_ECHO","T_CLOSE_TAG","T_WHITESPACE","T_START_HEREDOC","T_END_HEREDOC","T_DOLLAR_OPEN_CURLY_BRACES","T_CURLY_OPEN","T_PAAMAYIM_NEKUDOTAYIM","T_DOUBLE_COLON","T_NAMESPACE","T_NS_C","T_DIR","T_NS_SEPARATOR"];
    var current = "UNKNOWN";
    constants.some(function( constant ) {
        if (PHP.Constants[ constant ] === token) {
            current = constant;
            return true;
        } else {
            return false;
        }
    });
    
    return current;
};

PHP.Utils.QueryString = function( str ) {
    str = str.trim();
    var variables = str.split(/&/);
    
    var items = {};
    
    variables.forEach( function( variable ) {
        
        var parts = variable.split(/=/),
            key = decodeURIComponent( parts[ 0 ] ),
            value = (parts.length > 1 ) ? decodeURIComponent( parts[ 1 ] ) : null,
            
            arrayManager = function( item, parse, value ) {
               
                
                var arraySearch = parse.match(/^\[([a-z+0-9_\-])*\]/i);
                
                if ( arraySearch !== null ) {
                    var key = ( arraySearch[ 1 ] === undefined ) ? Object.keys( item ).length : arraySearch[ 1 ];

                    
                    parse = parse.substring( arraySearch[ 0 ].length );
                    
                    if ( parse.length > 0 ) {
                        if ( typeof item[ key ] !== "object" && item[ key ] !== null ) {
                            item[ key ] = {};
                        }
                        
                        arrayManager( item[ key ], parse, value );
                    } else {
                        item[ key ] = ( value !== null) ? value.replace(/\+/g," ") : null;
                    }
                    
                }
                
                
            };
            
            // 
        
        
            var arraySearch = key.match(/^(.*?)((\[[a-z+0-9_\-]*\])+)$/i);

            if ( arraySearch !== null ) {
                key =  arraySearch[ 1 ];
                
                
                
                if ( typeof items[ key ] !== "object" ) {
                    items[ key ] = {};

                }
                
                arrayManager( items[ key ], arraySearch[ 2 ], value );
                

            }
            else  {
                items[ key ] = ( value !== null) ? value.replace(/\+/g," ") : null;
            }
        
        }, this);
   
    return items;
    
    };
    
    /* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 5.7.2012 
* @website http://hertzen.com
 */


PHP.Halt = function( level ) {
    
    
};
PHP.Compiler = function( AST ) {
    
    
    this.src = "";
    
    AST.forEach( function( action ){
        this.src += this[ action.type ]( action ) + ";\n";     
    }, this );

    this.INSIDE_METHOD = false;

};


PHP.Compiler.prototype.getName = function( item ) {
    var parts = item.parts;
    if (Array.isArray( parts )) {
        return parts[ 0 ];
    } else {
        return parts;
    }

};

PHP.Compiler.prototype.stmts = function( stmts ) {
    var src = "";
    
    stmts.forEach(function( stmt ){
        src += this.source( stmt );
        if ( /^Node_Expr_Post(Inc|Dec)$/.test( stmt.type ) ) {
            // trigger POST_MOD
            src += "." + this.VARIABLE_VALUE;
        }
        
        src += ";\n";
    }, this);
  
    return src;
};

PHP.Compiler.prototype.source = function( action ) {
    if ( action === null ) {
        return "undefined";
    }
    
    if (typeof action === "string") {
        return action;
    } else if ( action === undefined ) {
        
        return undefined;
    } else if ( action.type === "Node_Name" ) {
        return this.getName( action );
    }
    
    return this[ action.type ]( action );
};

PHP.Compiler.prototype.FILESYSTEM = "$FS";

PHP.Compiler.prototype.RESOURCES = "\π";

PHP.Compiler.prototype.ENV = "ENV";

PHP.Compiler.prototype.OUTPUT_BUFFER = "OUTPUT_BUFFER";

PHP.Compiler.prototype.CTX = PHP.Compiler.prototype.ENV + ".";

PHP.Compiler.prototype.PARAM_NAME = "n";

PHP.Compiler.prototype.PARAM_BYREF = "r";

PHP.Compiler.prototype.CATCH = "$Catch";

PHP.Compiler.prototype.EXCEPTION = "$Exception";

PHP.Compiler.prototype.SUPPRESS = "$Suppress";

PHP.Compiler.prototype.CONSTANTS = "$Constants";

PHP.Compiler.prototype.CONSTANT_GET = "get";

PHP.Compiler.prototype.CLASS_CONSTANT_GET = "$Class.ConstantGet";

PHP.Compiler.prototype.CONSTANT_SET = "set";

PHP.Compiler.prototype.MAGIC_CONSTANTS = "$MConstants";

PHP.Compiler.prototype.ASSIGN = "_";

PHP.Compiler.prototype.NEG = "$Neg";

PHP.Compiler.prototype.ADD = "$Add";

PHP.Compiler.prototype.MUL = "$Mul";

PHP.Compiler.prototype.MOD = "$Mod";

PHP.Compiler.prototype.DIV = "$Div";

PHP.Compiler.prototype.FUNCTION_HANDLER = "$FHandler";

PHP.Compiler.prototype.FUNCTION_STATIC = "$Static";

PHP.Compiler.prototype.FUNCTION_STATIC_SET = "$Set";

PHP.Compiler.prototype.BOOLEAN_OR = "$Or";

PHP.Compiler.prototype.PRE_INC = "$PreInc";

PHP.Compiler.prototype.PRE_DEC = "$PreDec";

PHP.Compiler.prototype.POST_INC = "$PostInc";

PHP.Compiler.prototype.POST_DEC = "$PostDec";

PHP.Compiler.prototype.MINUS = "$Minus";

PHP.Compiler.prototype.CONCAT = "$Concat";

PHP.Compiler.prototype.UNSET = "$Unset";

PHP.Compiler.prototype.EQUAL = "$Equal";

PHP.Compiler.prototype.SMALLER = "$Smaller";

PHP.Compiler.prototype.SMALLER_OR_EQUAL = "$S_Equal";

PHP.Compiler.prototype.GREATER = "$Greater";

PHP.Compiler.prototype.GREATER_OR_EQUAL = "$G_Equal";

PHP.Compiler.prototype.LABEL = "LABEL";

PHP.Compiler.prototype.LABEL_COUNT = 0;

PHP.Compiler.prototype.VARIABLE = "$";

PHP.Compiler.prototype.VARIABLE_VALUE = "$";

PHP.Compiler.prototype.CREATE_VARIABLE = "$$";

PHP.Compiler.prototype.ARRAY_GET = "offsetGet";

PHP.Compiler.prototype.METHOD_CALL = "$Call";

PHP.Compiler.prototype.DIM_FETCH = "$Dim";

PHP.Compiler.prototype.STATIC_CALL = "$StaticCall";

PHP.Compiler.prototype.CLASS_NAME = "$Name";

PHP.Compiler.prototype.INTERFACE_NEW = "$Class.INew";

PHP.Compiler.prototype.CLASS_NEW = "$Class.New";

PHP.Compiler.prototype.CLASS_GET = "$Class.Get";

PHP.Compiler.prototype.CLASS_PROPERTY_GET = "$Prop";

PHP.Compiler.prototype.STATIC_PROPERTY_GET = "$SProp";

PHP.Compiler.prototype.CLASS_METHOD = "Method";

PHP.Compiler.prototype.CLASS_CONSTANT = "Constant";

PHP.Compiler.prototype.CLASS_CONSTANT_FETCH = "$Constant";

PHP.Compiler.prototype.CLASS_PROPERTY = "Variable";

PHP.Compiler.prototype.CLASS_DECLARE = "Create";

PHP.Compiler.prototype.CLASS_NAMES = "$CLASSNAMES";

PHP.Compiler.prototype.CLASS_DESTRUCT = "$Destruct";

PHP.Compiler.prototype.CLASS_TYPE = "$CType";

PHP.Compiler.prototype.ARRAY_VALUE = "v";

PHP.Compiler.prototype.ARRAY_KEY = "k";

PHP.Compiler.prototype.ERROR  = "$ERROR";

PHP.Compiler.prototype.GLOBAL  = "$Global";

PHP.Compiler.prototype.SIGNATURE  = "$SIGNATURE";

PHP.Compiler.prototype.fixString =  function( result ) {
    
    

    
    if ( result.match(/^("|')/) === null) {
        result = '"' + result.replace(/([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1\\"') + '"';
    }
    
    if (result.match(/\r\n/) !== null) {
        var quote = result.substring(0, 1);
        

        
        // this might have unexpected consequenses
        result = result.replace(/\r\n"$/,'"');
        
        result = '[' + result.split(/\r\n/).map(function( item ){
            var a = item.replace(/\r/g,"").replace(/\n/,"\\n");
            return a;
        }).join( quote + "," + quote ) + '].join("\\n")';
                
    }
    

        
    return result;
    
/*
    $val = str_replace("\\", "\\\\", $val);
    //$val = str_replace("\n", "\\n", $val);
    //$val = str_replace("\t", "\\t", $val);
    $val = str_replace('"', '\\"', $val);
    //$val = str_replace('\\\\', '\\\\\\\\', $val);

    $val = str_replace("\n", "\\n", $val);
    $val = str_replace("\t", "\\t", $val);
*/


}

PHP.Compiler.prototype.Node_Expr_ArrayDimFetch = function( action ) {

    return this.source( action.variable ) + "."  + this.DIM_FETCH + '( this, ' + this.source( action.dim ) + " )"; 
};

PHP.Compiler.prototype.Node_Expr_Assign = function( action ) {
    var src = this.source( action.variable ) + "." + this.ASSIGN + "(" + this.source( action.expr ) + ")";
    /*
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }*/
    return src; 
};

PHP.Compiler.prototype.Node_Expr_AssignMinus = function( action ) {
    var src = this.source( action.variable ) + "." + this.VARIABLE_VALUE + " -= " + this.source( action.expr );
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }
    return src; 
};

PHP.Compiler.prototype.Node_Expr_AssignPlus = function( action ) {
    var src = this.source( action.variable ) + "." + this.VARIABLE_VALUE + " += " + this.source( action.expr );
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }
    return src; 
};


PHP.Compiler.prototype.Node_Expr_AssignMul = function( action ) {
    var src = this.source( action.variable ) + "." + this.VARIABLE_VALUE + " *= " + this.source( action.expr );
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }
    return src; 
};


PHP.Compiler.prototype.Node_Expr_AssignDiv = function( action ) {
    var src = this.source( action.variable ) + "." + this.VARIABLE_VALUE + " /= " + this.source( action.expr );
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }
    return src; 
};

PHP.Compiler.prototype.Node_Expr_AssignConcat = function( action ) {
    var src = this.source( action.variable ) + "." + this.VARIABLE_VALUE + " += " + this.source( action.expr );
    if (!/Node_Expr_(Plus|Mul|Div|Minus|BitwiseOr|BitwiseAnd)/.test(action.expr.type)) {
        src += "." + this.VARIABLE_VALUE;
    }
    return src; 
};

PHP.Compiler.prototype.Node_Expr_AssignRef = function( action ) {
   
     
    console.log( action );
    return src; 
};

PHP.Compiler.prototype.Node_Expr_Ternary = function( action ) {
    var src = "(( " + this.source( action.cond ) + "." + this.VARIABLE_VALUE + " ) ? " + this.source( action.If ) + " : " + this.source( action.Else ) + ")"; 
     
    return src; 
};

PHP.Compiler.prototype.Node_Expr_ErrorSuppress = function( action ) {
    var src = this.CTX + this.SUPPRESS + "(function() { return " + this.source( action.expr ) + " })";
    return src; 
};

PHP.Compiler.prototype.Node_Expr_FuncCall = function( action ) {

    var src = "",
    args = [];
    if ( action.func.type === "Node_Expr_Variable") {
        src += "(" + this.CTX + "[ " + this.source( action.func ) + "." + this.VARIABLE_VALUE + " ](";
    } else {
        src += "(" + this.CTX + this.getName( action.func ) + "(";
        
        if (this.getName( action.func ) === "eval") {
            args.push("$");
        }
        
    }
   
    action.args.forEach(function( arg ){
        
        args.push( this.source( arg.value ) );
    }, this);
    
    src += args.join(", ") + "))";
   
    return src;
};

PHP.Compiler.prototype.Node_Expr_Exit = function( action ) {
    var src = this.CTX + "exit( " + this.source(action.expr) + " )";

    return src;  
};

PHP.Compiler.prototype.Node_Expr_Isset = function( action ) {

    var src = this.CTX + "isset( ";
    
    var args = [];
    action.variables.forEach(function( arg ){
        
        args.push( this.source( arg) );
    }, this);
 
    src += args.join(", ") + " )";
    
    return src;
};

PHP.Compiler.prototype.Node_Expr_UnaryPlus = function( action ) {
    return this.source( action.expr );
};

PHP.Compiler.prototype.Node_Expr_UnaryMinus = function( action ) {
    return this.source( action.expr ) + "." + this.NEG + "()";
};

PHP.Compiler.prototype.Node_Expr_BitwiseOr = function( action ) {
    return this.source( action.left ) + "." + this.VARIABLE_VALUE + " | " + this.source( action.right ) + "." + this.VARIABLE_VALUE;
};

PHP.Compiler.prototype.Node_Expr_BitwiseAnd = function( action ) {
    return this.source( action.left )  + "." + this.VARIABLE_VALUE + " & " + this.source( action.right ) + "." + this.VARIABLE_VALUE;
};

PHP.Compiler.prototype.Node_Expr_Div = function( action ) {
    return this.source( action.left ) + "." + this.DIV + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Minus = function( action ) {
    return this.source( action.left ) + "." + this.MINUS + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Mul = function( action ) {
    return this.source( action.left ) + "." + this.MUL + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Mod = function( action ) {
    return this.source( action.left ) + "." + this.MOD + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Plus = function( action ) {
    return this.source( action.left ) + "." + this.ADD + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Equal = function( action ) {
    return this.source( action.left ) + "." + this.EQUAL + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Smaller = function( action ) {
    return this.source( action.left ) + "." + this.SMALLER+ "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Greater = function( action ) {
    return this.source( action.left ) + "." + this.GREATER+ "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_GreaterOrEqual = function( action ) {
    return this.source( action.left ) + "." + this.GREATER_OR_EQUAL + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_SmallerOrEqual = function( action ) {
    return this.source( action.left ) + "." + this.SMALLER_OR_EQUAL + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_PreInc = function( action ) {
    return this.source( action.variable ) + "." + this.PRE_INC;
};

PHP.Compiler.prototype.Node_Expr_PreDec = function( action ) {
    return this.source( action.variable ) + "." + this.PRE_DEC;
};

PHP.Compiler.prototype.Node_Expr_PostInc = function( action ) {
    return this.source( action.variable ) + "." + this.POST_INC + "()";
};

PHP.Compiler.prototype.Node_Expr_PostDec = function( action ) {
    return this.source( action.variable ) + "." + this.POST_DEC;
};

PHP.Compiler.prototype.Node_Expr_Concat = function( action ) {
    return this.source( action.left ) + "." + this.CONCAT + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_BooleanOr = function( action ) {

    return  this.source( action.left ) + "." + this.BOOLEAN_OR + "(" + this.source( action.right ) + ")";
};

PHP.Compiler.prototype.Node_Expr_Print = function( action ) {

    var src = this.CTX + 'print( ';

    src += this.source(action.expr);
  

    src += ' )';
    return src;
};

PHP.Compiler.prototype.Node_Expr_Variable = function( action ) {
    var src = this.VARIABLE + "(";

    if ( action.name === "this" ) {
        return action.name;
    } else {
        
        if ( typeof action.name === "string" ) {
            src += '"' + this.source( action.name ) + '"';
        } else {
            src += this.source( action.name ) + "." + this.VARIABLE_VALUE;
        }
        
    //  return this.VARIABLE + '("' + this.source( action.name ) + '")';       
    }
    
    return src + ")";
};

PHP.Compiler.prototype.Node_Expr_Cast_String = function( action ) {
    return  this.source( action.expr ) + "." + PHP.VM.Variable.prototype.CAST_STRING;
};

PHP.Compiler.prototype.Node_Expr_Include = function( action ) {
    return  this.CTX + "include( " +this.VARIABLE + ", " + this.source( action.expr ) + " )";
};

PHP.Compiler.prototype.Node_Expr_New = function( action ) {

    var src = this.CREATE_VARIABLE + '(new (' + this.CTX + this.CLASS_GET + '("' + this.getName( action.Class ) + '"))( this';
    
    action.args.forEach(function( arg ) {
        
        src += ", "  + this.source( arg.value );
    }, this);
    
    src += " ))";

    return src; 
};



PHP.Compiler.prototype.Node_Expr_ConstFetch = function( action ) {

    if (/true|false|null/i.test(action.name.parts)) {
        return this.CREATE_VARIABLE + '(' + action.name.parts.toLowerCase() + ')';
    } else {
        return this.CTX + this.CONSTANTS + '.' + this.CONSTANT_GET + '("' + this.source( action.name ) + '")';
    }
    
};


PHP.Compiler.prototype.Node_Expr_MethodCall = function( action ) {

    var src = this.source( action.variable ) + "." + this.METHOD_CALL + '( ';
    
    src += ( action.variable.name === "this") ? "ctx" : "this";

    src += ', "' + action.name + '"';

    action.args.forEach(function( arg ) {
        src += ", " + this.source( arg.value );
    }, this);
  
    
  
    src += ")";
  
    return src;

};

PHP.Compiler.prototype.Node_Expr_PropertyFetch = function( action ) {

    if ( action.variable.name !== "this" ) {
        return this.source( action.variable ) + "." + this.VARIABLE_VALUE + "." + this.CLASS_PROPERTY_GET + '( this, "' + this.source( action.name ) + '" )';
    } else {
        return "this." + this.CLASS_PROPERTY_GET + '( ctx, "' + this.source( action.name ) + '" )';
    }
    
};

PHP.Compiler.prototype.Node_Expr_ClassConstFetch = function( action ) {

   
    return this.CTX + this.CLASS_CONSTANT_GET + '("' + this.source( action.Class ) + '", this, "' + action.name  + '" )';
    
    
};

PHP.Compiler.prototype.Node_Expr_StaticCall = function( action ) {

    var src = "";
    if (/^(parent|self)$/i.test( action.Class.parts )) {
        src += "this." + this.STATIC_CALL + '( ' + ( (this.INSIDE_METHOD === true) ? "ctx" : "this") + ', "' + action.Class.parts +'", "' + action.func + '"';
    } else {
        src += this.CTX + this.CLASS_GET + '("' + this.source( action.Class ) + '", this).' + this.STATIC_CALL + '( ' + ( (this.INSIDE_METHOD === true) ? "ctx" : "this") + ', "' + action.Class.parts +'", "' + action.func + '"';
    }
    
 
    action.args.forEach(function( arg ) {
        src += ", " + this.source( arg.value );
    }, this);
  
    src += ")";
  
    return src;

};

PHP.Compiler.prototype.Node_Expr_StaticPropertyFetch = function( action ) {
   
    var src = "";
    if (/^(parent|self)$/i.test( action.Class.parts )) {
        src += "this." + this.STATIC_PROPERTY_GET + '( ' + ( (this.INSIDE_METHOD === true) ? "ctx" : "this") + ', "' + action.Class.parts +'", "' + action.name.substring(1) + '"';
    } else {
        src += this.CTX + this.CLASS_GET + '("' + this.source( action.Class ) + '", this).' + this.STATIC_PROPERTY_GET + '( ' + ( (this.INSIDE_METHOD === true) ? "ctx" : "this") + ', "' + action.Class.parts +'", "' + action.name.substring(1) + '"';
    }
    
    src += ")";
    
    return src;
    
};

PHP.Compiler.prototype.Node_Expr_Array = function( action ) {
    
    var src = this.CTX + "array([",
    items = [];

    ((Array.isArray(action.items)) ? action.items : [ action.items ]).forEach(function( item ){
        
        items.push("{" + this.ARRAY_VALUE + ":" + this.source( item.value ) + ( ( item.key !== undefined) ? ", " + this.ARRAY_KEY + ":" + this.source( item.key ) : "") +  "}");
    }, this);
      
    src += items.join(", ") + "])";
    return src;

};

  
PHP.Compiler.prototype.Node_Stmt_Interface = function( action ) {
    
    console.log( action );
    
    var src = this.CTX + this.INTERFACE_NEW + '( "' + action.name + '", [';
    
    var exts = [];
    
    action.Extends.forEach(function( ext ){
        exts.push( '"' + ext + '"' );
    }, this);
    
    src += exts.join(", ")
    
    src += "], function( M, $ ){\n M";
    
    this.currentClass = action.name;
    action.stmts.forEach(function( stmt ) {
        src += this.source( stmt );
    }, this);
    
    
    src += "." + this.CLASS_DECLARE + '()})'
    
    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Class = function( action ) {
    
    console.log( action );
    
    var src = this.CTX + this.CLASS_NEW + '( "' + action.name + '", ' + action.Type + ', {';
    
    if ( action.Extends !== null ) {
        src += 'Extends: "' + this.source(action.Extends) + '"';
    }
    
    if ( action.Implements.length > 0 ) {
        if ( action.Extends !== null ) {
            src += ", "
        }
        src += 'Implements: [' + action.Implements.map(function( item ){
            return '"' + item.parts + '"';
        }).join(", ") + "]";
    }
    
    src += "}, function( M, $ ){\n M";
    
    this.currentClass = action.name;
    action.stmts.forEach(function( stmt ) {
        src += this.source( stmt );
    }, this);
    
    src += "." + this.CLASS_DECLARE + '()'
    
    src += "})"
    
    
    
    
    return src;
};


PHP.Compiler.prototype.Node_Stmt_Echo = function( action ) {
    
    var src = this.CTX + 'echo( ',
    args = [];
    if ( Array.isArray(action.exprs) ) {
        action.exprs.forEach(function( arg ){
            args.push( this.source( arg ) );
        }, this);
        src += args.join(", ");
    } else {
        src += this.source(action.exprs);
    }

    src += ' )';
    return src;
};

PHP.Compiler.prototype.Node_Stmt_For = function( action ) {
    
    var src = this.LABEL + this.LABEL_COUNT++ + ":\n";
    
    src += "for( " + this.source( action.init ) + "; ";
    
    src += "(" + this.source( action.cond ) + ")." + PHP.VM.Variable.prototype.CAST_BOOL + "." + this.VARIABLE_VALUE + "; ";
    
    src += this.source( action.loop ) + "." + this.VARIABLE_VALUE + " ) {\n";
    
    src += this.stmts( action.stmts );
    
    src += "}";

    return src;
};

PHP.Compiler.prototype.Node_Stmt_While = function( action ) {

    var src = this.LABEL + this.LABEL_COUNT++ + ":\n";
    
    src += "while( " + this.source( action.cond ) + "." + PHP.VM.Variable.prototype.CAST_BOOL + "." + this.VARIABLE_VALUE + ") {\n";
    
    src += this.stmts( action.stmts );
    
    src += "}";

    return src;
};

PHP.Compiler.prototype.Node_Stmt_Do = function( action ) {

    var src = this.LABEL + this.LABEL_COUNT++ + ":\n";
    src += "do {\n"
    src += this.stmts( action.stmts );
    src += "} while( " + this.source( action.cond ) + "." + PHP.VM.Variable.prototype.CAST_BOOL + "." + this.VARIABLE_VALUE + ")";

    return src;
};

PHP.Compiler.prototype.Node_Stmt_Switch = function( action ) {
    var src = this.LABEL + this.LABEL_COUNT++ + ":\n";
    src += "switch(" + this.source( action.cond ) + "." + this.VARIABLE_VALUE+ ") {\n";
    
    action.cases.forEach(function( item ){
        src += this.source( item ) + ";\n";
    }, this);
    src += "}";
    
    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Case = function( action ) {

    var src = "";
    if (action.cond === null) {
        src += "default:\n";
    } else {
        src += "case (" + this.source( action.cond ) + "." + this.VARIABLE_VALUE+ "):\n";
    }
    
   
    action.stmts.forEach(function( item ){
        src += this.source( item ) + ";\n";
    }, this);
    
    
    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Foreach = function( action ) {
   
    var src = this.CTX + 'foreach( ' + this.VARIABLE + ', ' + this.source( action.expr ) + ', function() {\n'; 
    //( $, expr, func, value, key )

    src += this.stmts( action.stmts );

    src += '}, ' + this.source( action.valueVar );

    //  src += '}, "' + action.valueVar.name + '"';

    if (action.keyVar !== null) {
        src += ', ' + this.source( action.expr );
    }
    src += ')'
    
        

    return src;
};


PHP.Compiler.prototype.Node_Stmt_Continue = function( action ) {
    // todo fix
    var src = "return";
    console.log( action );
    return src;  
};

PHP.Compiler.prototype.Node_Stmt_Break = function( action ) {
    console.log( action );
    var src = "break"
    
    if (action.num !== null) {
        src += " " + this.LABEL + (this.LABEL_COUNT - action.num.value );
    }
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Function = function( action ) {
   
    var src = this.CTX +  action.name + " = Function.prototype.bind.apply( function( " + this.VARIABLE + ", " + this.FUNCTION_STATIC + "  ) {\n";
    
    src += this.VARIABLE + " = " + this.VARIABLE + "(["
    var params = [];
    ((action.params[ 0 ] === undefined || !Array.isArray( action.params[ 0 ] ) ) ? action.params : action.params[ 0 ]).forEach(function( param ){
        
        if ( param.type === "Node_Param" ) {
            var item = '{' + this.PARAM_NAME +':"' + param.name + '"';
            
            if ( param.byRef === true ) {
                item += "," + this.PARAM_BYREF + ':true'
            }
           
            item += '}'
            params.push( item );
        }
        
    }, this);
    
    src += params.join(", ") + "], arguments);\n"
    
    src += this.stmts( action.stmts );
    
    
    
    src += "}, (" + this.CTX + this.FUNCTION_HANDLER + ")( this ))";

    
    return src;  
};

PHP.Compiler.prototype.Node_Stmt_Static = function( action ) {
    // todo fix
    var src = this.FUNCTION_STATIC;
    action.vars.forEach( function( variable ){
        src += this.source( variable );
    }, this);

    console.log( action );
    return src;  
};

PHP.Compiler.prototype.Node_Stmt_StaticVar = function( action ) {
    // todo fix
    var src = "." + this.FUNCTION_STATIC_SET + '("' + action.name + '", ' + this.source( action.def ) + ")";

    console.log( action );
    return src;  
};

PHP.Compiler.prototype.Node_Stmt_Property = function( action ) {
    var src = "";
    console.log( action );
    action.props.forEach(function( prop ){
       
        src += "." + this.CLASS_PROPERTY + '( "' + prop.name + '", ' + action.Type;
        if ( prop.def !== null ) {
            src += ', ' + this.source( prop.def );
        }
        
        src += " )\n";
        
    }, this);
   
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Unset = function( action ) {
    var src = this.CTX + "unset( ",
    vars = [];

    action.variables.forEach(function( variable ){
        vars.push( this.source( variable ) );
    }, this);
    
    src += vars.join(", ") + " )";
    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_InlineHTML = function( action ) {
    var src = this.CTX + this.OUTPUT_BUFFER + ' += "' + action.value.replace(/[\\"]/g, '\\$&').replace(/\n/g,"\\n").replace(/\r/g,"") + '"';
    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_If = function( action ) {
    var src = "if ( (" + this.source( action.cond ) + ")." + PHP.VM.Variable.prototype.CAST_BOOL + "." + this.VARIABLE_VALUE + ") {\n"; 
    
    action.stmts.forEach(function( stmt ){
        src += this.source( stmt) + ";\n";
    }, this);
    
    action.elseifs.forEach(function( Elseif ){
        src += this.source( Elseif) + "\n";
    }, this);
   
    
    if ( action.Else !== null ) {
        src += "} else {\n";
        
        action.Else.stmts.forEach(function( stmt ){
            src += this.source( stmt) + ";\n";
        }, this);
    }
    
    src += "}"
    

    
    return src;
};

PHP.Compiler.prototype.Node_Stmt_ElseIf = function( action ) {
    var src = "} else if ( (" + this.source( action.cond ) + ")." + PHP.VM.Variable.prototype.CAST_BOOL + "." + this.VARIABLE_VALUE + ") {\n"; 
    
    action.stmts.forEach(function( stmt ){
        src += this.source( stmt) + ";\n";
    }, this);
    
    return src;
};


PHP.Compiler.prototype.Node_Stmt_Throw = function( action ) {
    var src = "throw " + this.source( action.expr ); 
    return src;
};

PHP.Compiler.prototype.Node_Stmt_TryCatch = function( action ) {
    var src = "try {\n";
    src += this.stmts( action.stmts ) + "} catch( emAll ) {\n";
    src += this.CTX + this.EXCEPTION + '( emAll )';
    
    action.catches.forEach(function( Catch ){
        src += this.source( Catch );
    }, this);
    
    src += ";\n }"

        console.log( action );
             this.source( action.expr ); 
    return src;
};

PHP.Compiler.prototype.Node_Stmt_Catch = function( action ) {
    var src = "." + this.CATCH + '( "' + action.variable + '", "' + action.Type.parts + '", function() {\n';
    src += this.stmts( action.stmts );
    src += "})"
    return src;
    
};

PHP.Compiler.prototype.Node_Stmt_ClassMethod = function( action ) {

    this.INSIDE_METHOD = true;
    var src = "." + this.CLASS_METHOD + '( "' + action.name + '", ' + action.Type + ', ';
    var props = [];
    
    
    
    ((Array.isArray(action.params[ 0 ])) ? action.params[ 0 ] : action.params).forEach(function( prop ){
        
        var obj = {
            name: prop.name
        };
        
        if (prop.def !== null) {
            obj.def = prop.def;
        }
        
        props.push( obj );
        
    }, this)   
        
    src += JSON.stringify( props ) + ', function( ' + this.VARIABLE + ', ctx ) {\n';
    
    if (action.stmts !== null ) {
        src += this.stmts( action.stmts );
    }
    
    src += '})\n';
    this.INSIDE_METHOD = false;
    return src;
};

PHP.Compiler.prototype.Node_Stmt_ClassConst = function( action ) {
    var src = "";
   
    ((Array.isArray( action.consts[ 0 ] )) ?  action.consts[ 0 ] : action.consts ).forEach(function( constant ){
        src += "." + this.CLASS_CONSTANT + '("' + constant.name + '", ' + this.source( constant.value ) + ")\n"
     }, this);
    return src;

};

PHP.Compiler.prototype.Node_Stmt_Return = function( action ) {
    return "return " + this.source( action.expr );

};PHP.Compiler.prototype.Node_Scalar_String = function( action ) {

    return this.CREATE_VARIABLE + '(' + this.fixString(action.value) + ')';
    
};

PHP.Compiler.prototype.Node_Scalar_Encapsed = function( action ) {

    var parts = []
    action.parts.forEach(function( part ){
        if ( typeof part === "string" ) {
            parts.push( this.fixString( part ) )
        } else {
            
            
            
            parts.push( this.source( (part[ 0 ] === undefined) ? part : part[ 0 ] ) + "." + this.VARIABLE_VALUE );
        }
    }, this);
    
    var src = this.CREATE_VARIABLE + "(" + parts.join(" + ") + ")";
    return src;

    
};

PHP.Compiler.prototype.Node_Scalar_LNumber = function( action ) {

    return this.CREATE_VARIABLE + '(' + action.value + ')';
    
};


PHP.Compiler.prototype.Node_Scalar_DNumber = function( action ) {

    return this.CREATE_VARIABLE + '(' + action.value + ')';
    
};


PHP.Compiler.prototype.Node_Scalar_LNumber = function( action ) {

    return this.CREATE_VARIABLE + '(' + action.value + ')';
    
};

PHP.Compiler.prototype.Node_Scalar_MethodConst = function( action ) {

    return this.VARIABLE + '("$__METHOD__")';  
};

PHP.Compiler.prototype.Node_Scalar_FuncConst = function( action ) {

    return this.VARIABLE + '("$__FUNCTION__")';  
};

PHP.Compiler.prototype.Node_Scalar_ClassConst = function( action ) {

    return this.VARIABLE + '("$__CLASS__")';  
};

PHP.Compiler.prototype.Node_Scalar_FileConst = function( action ) {

    return this.VARIABLE + '("$__FILE__")';  
//   return this.CTX + PHP.Compiler.prototype.MAGIC_CONSTANTS + '("FILE")';
    
};

PHP.Compiler.prototype.Node_Scalar_LineConst = function( action ) {
    return this.VARIABLE + '("$__LINE__")';  
//    return this.CTX + PHP.Compiler.prototype.MAGIC_CONSTANTS + '("LINE")';
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 29.6.2012 
* @website http://hertzen.com
 */

PHP.Modules.prototype[ PHP.Compiler.prototype.FUNCTION_HANDLER ] = function( ENV ) {
    var args = [ null ], // undefined context for bind
    COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype,
    handler,
    staticVars = {}; // static variable storage
    
    
    // initializer
    args.push( function( args, values ) {
        handler = PHP.VM.VariableHandler( ENV );
        var vals = Array.prototype.slice.call( values, 2 );
       console.log( vals );
       
        Object.keys( staticVars ).forEach( function( key ){
            handler( key, staticVars[ key ] );
        });
        
        args.forEach(function( argObject, index ){
            var arg = handler( argObject[ COMPILER.PARAM_NAME ] );
            
            // check that we aren't passing a constant for arg which is defined byRef
            if ( argObject[ COMPILER.PARAM_BYREF ] === true && ( vals[ index ][ VARIABLE.CLASS_CONSTANT ] === true || vals[ index ][ VARIABLE.CONSTANT ] === true) ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Only variables can be passed by reference", PHP.Constants.E_ERROR, true );  
            }
            
            arg[ COMPILER.VARIABLE_VALUE ] = vals[ index ][ COMPILER.VARIABLE_VALUE ];
        });
        
        return handler;
    } );
    
    // static handler
    var staticHandler = {};
    staticHandler[ COMPILER.FUNCTION_STATIC_SET ] = function( name, def ) {
        
        if ( staticVars[ name ] !== undefined ) {
            // already defined
            return staticHandler;
        }
        // store it to storage for this func
        staticVars[ name ] = def;
        
        // assign it to current running context as well
        handler( name, def );
        
        return staticHandler;
    };
    
    args.push( staticHandler );
    
    
    return args;
    
};

PHP.Modules.prototype[ PHP.Compiler.prototype.SIGNATURE ] = function( args, name, len, types ) {
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype,
    _SERVER = this[ COMPILER.GLOBAL ]('_SERVER')[ COMPILER.VARIABLE_VALUE ],
    typeStrings = {};
    
    typeStrings[ VARIABLE.NULL ] = "null";
    typeStrings[ VARIABLE.BOOL ] = "boolean";
    typeStrings[ VARIABLE.INT ] = "long";
    typeStrings[ VARIABLE.FLOAT ] = "float";
    typeStrings[ VARIABLE.STRING ] = "string";
    typeStrings[ VARIABLE.ARRAY ] = "array";
    typeStrings[ VARIABLE.OBJECT ] = "object";
    typeStrings[ VARIABLE.RESOURCE ] = "resource";
    
    
    if ( args.length !== len ) {
       
        this[ COMPILER.ERROR ]( name + "() expects exactly " + len + " parameter, " + args.length + " given in " + 
            _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ] + 
            " on line " + 0, PHP.Constants.E_CORE_WARNING );    
        return false;
    } else {
        
        if ( Array.isArray( types ) ) {
            var fail = false;
            types.forEach(function( type, paramIndex ){
                
                if ( Array.isArray( type ) ) {
                    
                    if ( type.indexOf( args[ paramIndex ][ VARIABLE.TYPE ] ) === -1 ) {
                        if ( type.indexOf( VARIABLE.STRING ) === -1 || ( args[ paramIndex ][ VARIABLE.CAST_STRING ][ VARIABLE.TYPE ] !== VARIABLE.STRING )  ) {
                          
                            this[ COMPILER.ERROR ]( name + "() expects parameter " + ( paramIndex + 1 ) + " to be " + typeStrings[ type[ 0 ] ] + ", " + typeStrings[ args[ paramIndex ][ VARIABLE.TYPE ] ] + " given in " + 
                                _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ] + 
                                " on line " + 0, PHP.Constants.E_CORE_WARNING );  
                            fail = true;
                        }
                    }
                    
                } else {
                    if ( type !== args[ paramIndex ][ VARIABLE.TYPE ] ) {
                        if ( type !== VARIABLE.STRING || ( typeof args[ paramIndex ][ VARIABLE.CAST_STRING ] !== "function" )  ) {
                            this[ COMPILER.ERROR ]( name + "() expects parameter " + ( paramIndex + 1 ) + " to be " + typeStrings[ type ] + ", " + typeStrings[ args[ paramIndex ][ VARIABLE.TYPE ] ] + " given in " + 
                                _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ] + 
                                " on line " + 0, PHP.Constants.E_CORE_WARNING );  
                            fail = true;
                        }
                    }
                }
                
                
                
            }, this);
            if ( fail === true ) {
                return false;
            }
    
        } 
        
        return true;
    }
};

(function( MODULES ){
    
    var COMPILER = PHP.Compiler.prototype,
    suppress = false;
    
    MODULES[ COMPILER.SUPPRESS ] = function( expr ) {
        suppress = true;
        
        var result = expr();
        
        if ( result === undefined ) {
            result = new PHP.VM.Variable();
        }
        
        result[ COMPILER.SUPPRESS ] = true;
 
        suppress = false;
        return result;
    };
    
    MODULES[ COMPILER.EXCEPTION ] = function( variable ) {
       
        var methods =  {},
        VARIABLE = PHP.VM.Variable.prototype;
        
        methods[ COMPILER.CATCH ] = function( name, type, func ) {
            if ( variable[ VARIABLE.TYPE ] === VARIABLE.OBJECT  ) {
                
                if ( variable[ COMPILER.VARIABLE_VALUE ][ COMPILER.CLASS_NAME ] === type ) {
                    // TODO pass variable to func
                    func();
                }
            }
            
        };
       
        return methods;
    };
    
    MODULES[ COMPILER.ERROR ] = function( msg, level, lineAppend ) {
        var C = PHP.Constants,        
        _SERVER = this[ COMPILER.GLOBAL ]('_SERVER')[ COMPILER.VARIABLE_VALUE ];
        
        lineAppend = ( lineAppend === true ) ? " in " + _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ] + " on line 1" : ""; 
       
        if ( suppress === false ) {
            
            switch ( level ) {
                case C.E_ERROR:
                    this.echo( new PHP.VM.Variable("\nFatal error: " + msg + lineAppend + "\n"));
                    throw new PHP.Halt( level );
                    return;
                    break;
            
                case C.E_WARNING:
                case C.E_CORE_WARNING:
                case C.E_COMPILE_WARNING:
                case C.E_USER_WARNING:
                    this.echo( new PHP.VM.Variable("\nWarning: " + msg + lineAppend + "\n"));
                    return;
                    break;
                case C.E_PARSE:
                    this.echo( new PHP.VM.Variable("\nParse error: " + msg + lineAppend + "\n"));
                    return;
                    break;
                case C.E_CORE_NOTICE:
                    this.echo( new PHP.VM.Variable("\nNotice: " + msg + lineAppend + "\n"));
                    return;
                    break;
                default:
                    this.echo( new PHP.VM.Variable("\nDefault Warning: " + msg + lineAppend + "\n"));
                    return;
            
            
            }
        }
        
    
    };
    
})( PHP.Modules.prototype )





/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 26.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.array = function( ) {
    
    var arr;
   
    if ( Array.isArray( arguments[ 0 ]) ) {
        arr = new (this.$Class.Get("ArrayObject"))( this, arguments[ 0 ] );
    } else {
        arr = new (this.$Class.Get("ArrayObject"))( this );
    }
   
    return new PHP.VM.Variable( arr );
    
};
PHP.Modules.prototype.array_key_exists = function( key, search ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    
    if ( search[ VAR.TYPE ] === VAR.ARRAY ) {
        var keys = search[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.KEYS ][ COMPILER.VARIABLE_VALUE ];
        
        
                 
        var index = -1,
        value = key[ COMPILER.VARIABLE_VALUE ];
        
        
        
        keys.some(function( item, i ){
                
            if ( item instanceof PHP.VM.Variable ) {
                item = item[ COMPILER.VARIABLE_VALUE ];
            } 
                
          
                
            if ( item === value) {
                index = i;
                return true;
            }
                
            return false;
        });
        
        return new PHP.VM.Variable( ( index !== -1) );
    }
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 2.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.is_array = function( variable ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    

    return new PHP.VM.Variable( ( variable[ VAR.TYPE ] === VAR.ARRAY ) );
    
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 29.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.count = function( variable ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    
    if ( variable[ VAR.TYPE ] === VAR.ARRAY ) {
        var values = variable[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.VALUES ][ COMPILER.VARIABLE_VALUE ];
        
        return new PHP.VM.Variable( values.length );
    }
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 30.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.foreach = function( $, expr, func, value, key ) {
    
    
    
    var COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype,
    ARRAY = PHP.VM.Array.prototype;
    
    if ( expr[ VAR.TYPE ] === VAR.ARRAY ) {
        var values = expr[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + ARRAY.VALUES ][ COMPILER.VARIABLE_VALUE ],
        keys =  expr[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + ARRAY.KEYS ][ COMPILER.VARIABLE_VALUE ],
        len = values.length,
        pointer = expr[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + ARRAY.POINTER];
        
        
        
        
        for ( pointer[ COMPILER.VARIABLE_VALUE ] = 0; pointer[ COMPILER.VARIABLE_VALUE ] < len; pointer[ COMPILER.VARIABLE_VALUE ]++ ) {
          //  console.log(value[ COMPILER.VARIABLE_VALUE ]);
          // ref:  value[ COMPILER.VARIABLE_VALUE ] = values[ pointer[ COMPILER.VARIABLE_VALUE ] ][ COMPILER.VARIABLE_VALUE ];
        //  console.log(values[ pointer[ COMPILER.VARIABLE_VALUE ] ][ COMPILER.VARIABLE_VALUE ]);
          value[ COMPILER.VARIABLE_VALUE ] = values[ pointer[ COMPILER.VARIABLE_VALUE ] ][ COMPILER.VARIABLE_VALUE ];
          
            if ( key instanceof PHP.VM.Variable ) {
           //ref:     key[ COMPILER.VARIABLE_VALUE ] = keys[ pointer[ COMPILER.VARIABLE_VALUE ] ][ COMPILER.VARIABLE_VALUE ];
            }
            
            func();

        }
        
        
    //    return new PHP.VM.Variable( values.length );
    }
    
    
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 3.7.2012 
* @website http://hertzen.com
 */

PHP.Modules.prototype.include = function( $, file ) {
    
    var COMPILER = PHP.Compiler.prototype,
    _SERVER = this[ COMPILER.GLOBAL ]('_SERVER')[ COMPILER.VARIABLE_VALUE ],
    filename = file[ COMPILER.VARIABLE_VALUE ];
    
    
    
    var path = PHP.Utils.Path( _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ]);
    
    var source = this[ COMPILER.FILESYSTEM ].readFileSync( path + "/" + filename );
    
        
    var COMPILER = PHP.Compiler.prototype;
   
    // tokenizer
    var tokens = new PHP.Lexer( source );
   
    // build ast tree
    
    var AST = new PHP.Parser( tokens );
  
    // compile tree into JS
    var compiler = new PHP.Compiler( AST );
   
       console.log( compiler.src );
    // execture code in current context ($)
    var exec = new Function( "$$", "$", "ENV", compiler.src  );
    exec.call(this, function( arg ) {
        return new PHP.VM.Variable( arg );
    }, $, this);

 
    
};
/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 3.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.mktime = function( hour, minute, second, month, day, year, is_dst ) {
    
    var date = new Date(),
    COMPILER = PHP.Compiler.prototype;
    
    hour = ( hour === undefined ) ?  date.getHours()  : hour[ COMPILER.VARIABLE_VALUE ];
    minute = ( minute === undefined ) ?  date.getMinutes() : minute[ COMPILER.VARIABLE_VALUE ]; 
    second = ( second === undefined ) ? date.getSeconds()  : second[ COMPILER.VARIABLE_VALUE ];
    month = ( month === undefined ) ?  date.getMonth() : month[ COMPILER.VARIABLE_VALUE ];
    day = ( day === undefined ) ?  date.getDay() : day[ COMPILER.VARIABLE_VALUE ];
    year = ( year === undefined ) ?  date.getFullYear() : year[ COMPILER.VARIABLE_VALUE ];
    
    
    var createDate = new Date(year, month, day, hour, minute, second);
    
    
    return new PHP.VM.Variable( Math.round( createDate.getTime() / 1000 ) );
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 3.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.time = function() {
    
    return new PHP.VM.Variable( Math.round( Date.now() / 1000 ) );
};

/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 28.6.2012 
* @website http://hertzen.com
 */

// http://php.net/manual/en/errorfunc.constants.php

PHP.Constants.E_ERROR = 1;
PHP.Constants.E_WARNING = 2;
PHP.Constants.E_PARSE = 4;
PHP.Constants.E_NOTICE = 8;

PHP.Constants.E_CORE_ERROR = 16;
PHP.Constants.E_CORE_WARNING = 32;

PHP.Constants.E_COMPILE_ERROR = 64;
PHP.Constants.E_COMPILE_WARNING = 128;

PHP.Constants.E_USER_ERROR = 256;
PHP.Constants.E_USER_WARNING = 512;
PHP.Constants.E_USER_NOTICE = 1024;

PHP.Constants.E_STRICT = 2048;
PHP.Constants.E_RECOVERABLE_ERROR = 4096;
PHP.Constants.E_DEPRECATED = 8192;

PHP.Constants.E_USER_DEPRECATED = 16384;
PHP.Constants.E_ALL = 32767;

// todo add functionality
PHP.Modules.prototype.error_reporting = function( level ) {
    
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 26.6.2012 
* @website http://hertzen.com
 */

PHP.Modules.prototype.trigger_error = function( msg, level ) {
    throw new Error( "Fatal error: " + msg.$ );
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 30.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.fclose = function( fp ) {

    return new PHP.VM.Variable( true );
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 29.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.fopen = function( filename ) {

    return new PHP.VM.Variable( new PHP.VM.Resource() );
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 4.7.2012 
* @website http://hertzen.com
 */

PHP.Modules.prototype.call_user_func = function( callback ) {
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype;
    
    if ( callback[ VARIABLE.TYPE ] === VARIABLE.ARRAY ) {

        var Class = callback[ COMPILER.VARIABLE_VALUE ][ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 0 )[ COMPILER.VARIABLE_VALUE ],
        methodName = callback[ COMPILER.VARIABLE_VALUE ][ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 1 )[ COMPILER.VARIABLE_VALUE ];
        
        return Class[ COMPILER.METHOD_CALL ]( this, methodName, Array.prototype.slice.call( arguments, 1 ) );
        
    } else {
        return this[ callback[ COMPILER.VARIABLE_VALUE ]]( Array.prototype.slice.call( arguments, 1 ) );
    }
    
   
  
    
};
/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 7.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.define = function( name, value, case_insensitive ) {
    
    var COMPILER = PHP.Compiler.prototype,
    
    variableValue = value[ COMPILER.VARIABLE_VALUE ];
    
    this[ COMPILER.CONSTANTS ][ COMPILER.CONSTANT_SET ]( name[ COMPILER.VARIABLE_VALUE ], variableValue );
    
    
  
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 7.7.2012 
* @website http://hertzen.com
 */


/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 2.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.eval = function( $, code ) {
    

    
    var COMPILER = PHP.Compiler.prototype,
    _SERVER = this[ COMPILER.GLOBAL ]('_SERVER')[ COMPILER.VARIABLE_VALUE ];
   
    var source = code[ COMPILER.VARIABLE_VALUE ];
        

    // tokenizer
    var tokens = new PHP.Lexer( "<?" + source );
   
    // build ast tree
    
    var AST = new PHP.Parser( tokens, true );
  
    if ( Array.isArray(AST) ) {
        
    
  
        // compile tree into JS
        var compiler = new PHP.Compiler( AST );
   
    

    
    
    
        // execture code in current context ($)
        var exec = new Function( "$$", "$", "ENV", compiler.src  );
        exec.call(this, function( arg ) {
            return new PHP.VM.Variable( arg );
        }, $, this);
    
    } else {
        
                this[ COMPILER.ERROR ]( "syntax error, unexpected $end in " + 
            _SERVER[ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ] + 
            "(1) : eval()'d code on line " + 1, PHP.Constants.E_PARSE );    
        
    }
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 5.7.2012 
* @website http://hertzen.com
 */

PHP.Modules.prototype.ini_set = function( varname, newvalue ) {
  // todo add  
    
};

/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 24.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.echo = function() {
    var COMPILER = PHP.Compiler.prototype;
    Array.prototype.slice.call( arguments ).forEach(function( arg ){
        
        if (arg instanceof PHP.VM.VariableProto) {
            if ( arg[ PHP.VM.Variable.prototype.TYPE ] !== PHP.VM.Variable.prototype.NULL ) {
                this[ COMPILER.OUTPUT_BUFFER ] += arg[ COMPILER.VARIABLE_VALUE ];
            }
            
        } else {
            this[ COMPILER.OUTPUT_BUFFER ] += arg;
        }
        
    }, this);
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 27.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.implode = function( glue, pieces ) {
    var VARIABLE = PHP.VM.Variable.prototype,
    COMPILER = PHP.Compiler.prototype;
    
    if ( glue[ VARIABLE.TYPE ] === VARIABLE.ARRAY ) {
        // Defaults to an empty string
        pieces = glue;
        glue = "";
    } else {
        glue = glue[ COMPILER.VARIABLE_VALUE ];
    }
    
    var values = pieces[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.VALUES ][ COMPILER.VARIABLE_VALUE ];
    
    
    
    return new PHP.VM.Variable( values.map(function( val ){
        return val[ COMPILER.VARIABLE_VALUE ];
    }).join( glue ) );
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 27.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.parse_str = function( str, arr ) {
    
    
 
    
    
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 4.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.print = function( variable ) {
    this.echo( variable );
    return new PHP.VM.Variable(1);
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 3.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.strlen = function( string ) {
    
    var COMPILER = PHP.Compiler.prototype;
    
    return new PHP.VM.Variable( string[ COMPILER.VARIABLE_VALUE ].length );
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 2.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.strncmp = function( str1, str2, len ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    
  //  console.log(( str1[ COMPILER.VARIABLE_VALUE ].substring(0, len[ COMPILER.VARIABLE_VALUE ] ) === str2[ COMPILER.VARIABLE_VALUE ].substring(0, len[ COMPILER.VARIABLE_VALUE ] ) ), str1[ COMPILER.VARIABLE_VALUE ], str2[ COMPILER.VARIABLE_VALUE ]);
    // TODO add real
    
    if ( ( str1[ VAR.CAST_STRING ][ COMPILER.VARIABLE_VALUE ].substring(0, len[ COMPILER.VARIABLE_VALUE ] ) === str2[ VAR.CAST_STRING ][ COMPILER.VARIABLE_VALUE ].substring(0, len[ COMPILER.VARIABLE_VALUE ] ) ) ) {
         return new PHP.VM.Variable( 0 );
    } else {
         return new PHP.VM.Variable( 1 );
    }
   
    
    
};

var TOKEN_NONE    = -1;
var TOKEN_INVALID = 149;

var TOKEN_MAP_SIZE = 384;

var YYLAST       = 913;
var YY2TBLSTATE  = 328;
var YYGLAST      = 415;
var YYNLSTATES   = 544;
var YYUNEXPECTED = 32767;
var YYDEFAULT    = -32766;

// {{{ Tokens
var YYERRTOK = 256;
var T_INCLUDE = 262;
var T_INCLUDE_ONCE = 261;
var T_EVAL = 260;
var T_REQUIRE = 259;
var T_REQUIRE_ONCE = 258;
var T_LOGICAL_OR = 263;
var T_LOGICAL_XOR = 264;
var T_LOGICAL_AND = 265;
var T_PRINT = 266;
var T_PLUS_EQUAL = 277;
var T_MINUS_EQUAL = 276;
var T_MUL_EQUAL = 275;
var T_DIV_EQUAL = 274;
var T_CONCAT_EQUAL = 273;
var T_MOD_EQUAL = 272;
var T_AND_EQUAL = 271;
var T_OR_EQUAL = 270;
var T_XOR_EQUAL = 269;
var T_SL_EQUAL = 268;
var T_SR_EQUAL = 267;
var T_BOOLEAN_OR = 278;
var T_BOOLEAN_AND = 279;
var T_IS_EQUAL = 283;
var T_IS_NOT_EQUAL = 282;
var T_IS_IDENTICAL = 281;
var T_IS_NOT_IDENTICAL = 280;
var T_IS_SMALLER_OR_EQUAL = 285;
var T_IS_GREATER_OR_EQUAL = 284;
var T_SL = 287;
var T_SR = 286;
var T_INSTANCEOF = 288;
var T_INC = 297;
var T_DEC = 296;
var T_INT_CAST = 295;
var T_DOUBLE_CAST = 294;
var T_STRING_CAST = 293;
var T_ARRAY_CAST = 292;
var T_OBJECT_CAST = 291;
var T_BOOL_CAST = 290;
var T_UNSET_CAST = 289;
var T_NEW = 299;
var T_CLONE = 298;
var T_EXIT = 300;
var T_IF = 301;
var T_ELSEIF = 302;
var T_ELSE = 303;
var T_ENDIF = 304;
var T_LNUMBER = 305;
var T_DNUMBER = 306;
var T_STRING = 307;
var T_STRING_VARNAME = 308;
var T_VARIABLE = 309;
var T_NUM_STRING = 310;
var T_INLINE_HTML = 311;
var T_CHARACTER = 312;
var T_BAD_CHARACTER = 313;
var T_ENCAPSED_AND_WHITESPACE = 314;
var T_CONSTANT_ENCAPSED_STRING = 315;
var T_ECHO = 316;
var T_DO = 317;
var T_WHILE = 318;
var T_ENDWHILE = 319;
var T_FOR = 320;
var T_ENDFOR = 321;
var T_FOREACH = 322;
var T_ENDFOREACH = 323;
var T_DECLARE = 324;
var T_ENDDECLARE = 325;
var T_AS = 326;
var T_SWITCH = 327;
var T_ENDSWITCH = 328;
var T_CASE = 329;
var T_DEFAULT = 330;
var T_BREAK = 331;
var T_CONTINUE = 332;
var T_GOTO = 333;
var T_FUNCTION = 334;
var T_var = 335;
var T_RETURN = 336;
var T_TRY = 337;
var T_CATCH = 338;
var T_THROW = 339;
var T_USE = 340;
var T_INSTEADOF = 340;
var T_GLOBAL = 341;
var T_STATIC = 347;
var T_ABSTRACT = 346;
var T_FINAL = 345;
var T_PRIVATE = 344;
var T_PROTECTED = 343;
var T_PUBLIC = 342;
var T_VAR = 348;
var T_UNSET = 349;
var T_ISSET = 350;
var T_EMPTY = 351;
var T_HALT_COMPILER = 352;
var T_CLASS = 353;
var T_TRAIT = 364;
var T_INTERFACE = 354;
var T_EXTENDS = 355;
var T_IMPLEMENTS = 356;
var T_OBJECT_OPERATOR = 357;
var T_DOUBLE_ARROW = 358;
var T_LIST = 359;
var T_ARRAY = 360;
var T_CALLABLE = 362;
var T_CLASS_C = 361;
var T_TRAIT_C = 364;
var T_METHOD_C = 362;
var T_FUNC_C = 363;
var T_LINE = 364;
var T_FILE = 365;
var T_COMMENT = 366;
var T_DOC_COMMENT = 367;
var T_OPEN_TAG = 368;
var T_OPEN_TAG_WITH_ECHO = 369;
var T_CLOSE_TAG = 370;
var T_WHITESPACE = 371;
var T_START_HEREDOC = 372;
var T_END_HEREDOC = 373;
var T_DOLLAR_OPEN_CURLY_BRACES = 374;
var T_CURLY_OPEN = 375;
var T_PAAMAYIM_NEKUDOTAYIM = 376;
var T_DOUBLE_COLON = 376;
var T_NAMESPACE = 377;
var T_NS_C = 378;
var T_DIR = 379;
var T_NS_SEPARATOR = 380;



PHP.Constants.T_INCLUDE = 262;
PHP.Constants.T_INCLUDE_ONCE = 261;
PHP.Constants.T_EVAL = 260;
PHP.Constants.T_REQUIRE = 259;
PHP.Constants.T_REQUIRE_ONCE = 258;
PHP.Constants.T_LOGICAL_OR = 263;
PHP.Constants.T_LOGICAL_XOR = 264;
PHP.Constants.T_LOGICAL_AND = 265;
PHP.Constants.T_PRINT = 266;
PHP.Constants.T_PLUS_EQUAL = 277;
PHP.Constants.T_MINUS_EQUAL = 276;
PHP.Constants.T_MUL_EQUAL = 275;
PHP.Constants.T_DIV_EQUAL = 274;
PHP.Constants.T_CONCAT_EQUAL = 273;
PHP.Constants.T_MOD_EQUAL = 272;
PHP.Constants.T_AND_EQUAL = 271;
PHP.Constants.T_OR_EQUAL = 270;
PHP.Constants.T_XOR_EQUAL = 269;
PHP.Constants.T_SL_EQUAL = 268;
PHP.Constants.T_SR_EQUAL = 267;
PHP.Constants.T_BOOLEAN_OR = 278;
PHP.Constants.T_BOOLEAN_AND = 279;
PHP.Constants.T_IS_EQUAL = 283;
PHP.Constants.T_IS_NOT_EQUAL = 282;
PHP.Constants.T_IS_IDENTICAL = 281;
PHP.Constants.T_IS_NOT_IDENTICAL = 280;
PHP.Constants.T_IS_SMALLER_OR_EQUAL = 285;
PHP.Constants.T_IS_GREATER_OR_EQUAL = 284;
PHP.Constants.T_SL = 287;
PHP.Constants.T_SR = 286;
PHP.Constants.T_INSTANCEOF = 288;
PHP.Constants.T_INC = 297;
PHP.Constants.T_DEC = 296;
PHP.Constants.T_INT_CAST = 295;
PHP.Constants.T_DOUBLE_CAST = 294;
PHP.Constants.T_STRING_CAST = 293;
PHP.Constants.T_ARRAY_CAST = 292;
PHP.Constants.T_OBJECT_CAST = 291;
PHP.Constants.T_BOOL_CAST = 290;
PHP.Constants.T_UNSET_CAST = 289;
PHP.Constants.T_NEW = 299;
PHP.Constants.T_CLONE = 298;
PHP.Constants.T_EXIT = 300;
PHP.Constants.T_IF = 301;
PHP.Constants.T_ELSEIF = 302;
PHP.Constants.T_ELSE = 303;
PHP.Constants.T_ENDIF = 304;
PHP.Constants.T_LNUMBER = 305;
PHP.Constants.T_DNUMBER = 306;
PHP.Constants.T_STRING = 307;
PHP.Constants.T_STRING_VARNAME = 308;
PHP.Constants.T_VARIABLE = 309;
PHP.Constants.T_NUM_STRING = 310;
PHP.Constants.T_INLINE_HTML = 311;
PHP.Constants.T_CHARACTER = 312;
PHP.Constants.T_BAD_CHARACTER = 313;
PHP.Constants.T_ENCAPSED_AND_WHITESPACE = 314;
PHP.Constants.T_CONSTANT_ENCAPSED_STRING = 315;
PHP.Constants.T_ECHO = 316;
PHP.Constants.T_DO = 317;
PHP.Constants.T_WHILE = 318;
PHP.Constants.T_ENDWHILE = 319;
PHP.Constants.T_FOR = 320;
PHP.Constants.T_ENDFOR = 321;
PHP.Constants.T_FOREACH = 322;
PHP.Constants.T_ENDFOREACH = 323;
PHP.Constants.T_DECLARE = 324;
PHP.Constants.T_ENDDECLARE = 325;
PHP.Constants.T_AS = 326;
PHP.Constants.T_SWITCH = 327;
PHP.Constants.T_ENDSWITCH = 328;
PHP.Constants.T_CASE = 329;
PHP.Constants.T_DEFAULT = 330;
PHP.Constants.T_BREAK = 331;
PHP.Constants.T_CONTINUE = 332;
PHP.Constants.T_GOTO = 333;
PHP.Constants.T_FUNCTION = 334;
PHP.Constants.T_CONST = 335;
PHP.Constants.T_RETURN = 336;
PHP.Constants.T_TRY = 337;
PHP.Constants.T_CATCH = 338;
PHP.Constants.T_THROW = 339;
PHP.Constants.T_USE = 340;
//PHP.Constants.T_INSTEADOF = ;
PHP.Constants.T_GLOBAL = 341;
PHP.Constants.T_STATIC = 347;
PHP.Constants.T_ABSTRACT = 346;
PHP.Constants.T_FINAL = 345;
PHP.Constants.T_PRIVATE = 344;
PHP.Constants.T_PROTECTED = 343;
PHP.Constants.T_PUBLIC = 342;
PHP.Constants.T_VAR = 348;
PHP.Constants.T_UNSET = 349;
PHP.Constants.T_ISSET = 350;
PHP.Constants.T_EMPTY = 351;
PHP.Constants.T_HALT_COMPILER = 352;
PHP.Constants.T_CLASS = 353;
//PHP.Constants.T_TRAIT = ;
PHP.Constants.T_INTERFACE = 354;
PHP.Constants.T_EXTENDS = 355;
PHP.Constants.T_IMPLEMENTS = 356;
PHP.Constants.T_OBJECT_OPERATOR = 357;
PHP.Constants.T_DOUBLE_ARROW = 358;
PHP.Constants.T_LIST = 359;
PHP.Constants.T_ARRAY = 360;
//PHP.Constants.T_CALLABLE = ;
PHP.Constants.T_CLASS_C = 361;
PHP.Constants.T_TRAIT_C = 381;
PHP.Constants.T_METHOD_C = 362;
PHP.Constants.T_FUNC_C = 363;
PHP.Constants.T_LINE = 364;
PHP.Constants.T_FILE = 365;
PHP.Constants.T_COMMENT = 366;
PHP.Constants.T_DOC_COMMENT = 367;
PHP.Constants.T_OPEN_TAG = 368;
PHP.Constants.T_OPEN_TAG_WITH_ECHO = 369;
PHP.Constants.T_CLOSE_TAG = 370;
PHP.Constants.T_WHITESPACE = 371;
PHP.Constants.T_START_HEREDOC = 372;
PHP.Constants.T_END_HEREDOC = 373;
PHP.Constants.T_DOLLAR_OPEN_CURLY_BRACES = 374;
PHP.Constants.T_CURLY_OPEN = 375;
PHP.Constants.T_PAAMAYIM_NEKUDOTAYIM = 376;
PHP.Constants.T_DOUBLE_COLON = 376;
PHP.Constants.T_NAMESPACE = 377;
PHP.Constants.T_NS_C = 378;
PHP.Constants.T_DIR = 379;
PHP.Constants.T_NS_SEPARATOR = 380;/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 28.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.token_get_all = function( code ) {
    var VARIABLE = PHP.VM.Variable.prototype,
    COMPILER = PHP.Compiler.prototype;
    
    
    if ( !this[ COMPILER.SIGNATURE ]( arguments, "token_get_all", 1, [ [ VARIABLE.STRING, VARIABLE.NULL ] ] ) ) {
        return new PHP.VM.Variable( null );
    }
   
    switch( code[ VARIABLE.TYPE ] ) {
        
        case VARIABLE.BOOL:
            if ( code[ COMPILER.VARIABLE_VALUE ] === true ) {
                return PHP.VM.Array.fromObject.call( this, PHP.Lexer( "1" ));
            } else {
                return PHP.VM.Array.fromObject.call( this, PHP.Lexer( null ));
            }
            break;
        case VARIABLE.STRING:
        case VARIABLE.NULL:
            return PHP.VM.Array.fromObject.call( this, PHP.Lexer( code[ COMPILER.VARIABLE_VALUE ] ));
            break;
            
         default:
             return PHP.VM.Array.fromObject.call( this, PHP.Lexer( code[ VARIABLE.CAST_STRING ][ COMPILER.VARIABLE_VALUE ] ));
        
    }
    
    
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 15.6.2012 
* @website http://hertzen.com
 */

/* token_name — Get the symbolic name of a given PHP token
 * string token_name ( int $token )
 */

PHP.Modules.prototype.token_name = function( token ) {
    
    if ( !this[ PHP.Compiler.prototype.SIGNATURE ]( arguments, "token_name", 1, [ PHP.VM.Variable.prototype.INT ] ) ) {
        return new PHP.VM.Variable( null );
    }
    
    // TODO invert this for faster performance
    var constants = {};
    constants.T_INCLUDE = 262;
    constants.T_INCLUDE_ONCE = 261;
    constants.T_EVAL = 260;
    constants.T_REQUIRE = 259;
    constants.T_REQUIRE_ONCE = 258;
    constants.T_LOGICAL_OR = 263;
    constants.T_LOGICAL_XOR = 264;
    constants.T_LOGICAL_AND = 265;
    constants.T_PRINT = 266;
    constants.T_PLUS_EQUAL = 277;
    constants.T_MINUS_EQUAL = 276;
    constants.T_MUL_EQUAL = 275;
    constants.T_DIV_EQUAL = 274;
    constants.T_CONCAT_EQUAL = 273;
    constants.T_MOD_EQUAL = 272;
    constants.T_AND_EQUAL = 271;
    constants.T_OR_EQUAL = 270;
    constants.T_XOR_EQUAL = 269;
    constants.T_SL_EQUAL = 268;
    constants.T_SR_EQUAL = 267;
    constants.T_BOOLEAN_OR = 278;
    constants.T_BOOLEAN_AND = 279;
    constants.T_IS_EQUAL = 283;
    constants.T_IS_NOT_EQUAL = 282;
    constants.T_IS_IDENTICAL = 281;
    constants.T_IS_NOT_IDENTICAL = 280;
    constants.T_IS_SMALLER_OR_EQUAL = 285;
    constants.T_IS_GREATER_OR_EQUAL = 284;
    constants.T_SL = 287;
    constants.T_SR = 286;
    constants.T_INSTANCEOF = 288;
    constants.T_INC = 297;
    constants.T_DEC = 296;
    constants.T_INT_CAST = 295;
    constants.T_DOUBLE_CAST = 294;
    constants.T_STRING_CAST = 293;
    constants.T_ARRAY_CAST = 292;
    constants.T_OBJECT_CAST = 291;
    constants.T_BOOL_CAST = 290;
    constants.T_UNSET_CAST = 289;
    constants.T_NEW = 299;
    constants.T_CLONE = 298;
    constants.T_EXIT = 300;
    constants.T_IF = 301;
    constants.T_ELSEIF = 302;
    constants.T_ELSE = 303;
    constants.T_ENDIF = 304;
    constants.T_LNUMBER = 305;
    constants.T_DNUMBER = 306;
    constants.T_STRING = 307;
    constants.T_STRING_VARNAME = 308;
    constants.T_VARIABLE = 309;
    constants.T_NUM_STRING = 310;
    constants.T_INLINE_HTML = 311;
    constants.T_CHARACTER = 312;
    constants.T_BAD_CHARACTER = 313;
    constants.T_ENCAPSED_AND_WHITESPACE = 314;
    constants.T_CONSTANT_ENCAPSED_STRING = 315;
    constants.T_ECHO = 316;
    constants.T_DO = 317;
    constants.T_WHILE = 318;
    constants.T_ENDWHILE = 319;
    constants.T_FOR = 320;
    constants.T_ENDFOR = 321;
    constants.T_FOREACH = 322;
    constants.T_ENDFOREACH = 323;
    constants.T_DECLARE = 324;
    constants.T_ENDDECLARE = 325;
    constants.T_AS = 326;
    constants.T_SWITCH = 327;
    constants.T_ENDSWITCH = 328;
    constants.T_CASE = 329;
    constants.T_DEFAULT = 330;
    constants.T_BREAK = 331;
    constants.T_CONTINUE = 332;
    constants.T_GOTO = 333;
    constants.T_FUNCTION = 334;
    constants.T_CONST = 335;
    constants.T_RETURN = 336;
    constants.T_TRY = 337;
    constants.T_CATCH = 338;
    constants.T_THROW = 339;
    constants.T_USE = 340;
    //constants.T_INSTEADOF = ;
    constants.T_GLOBAL = 341;
    constants.T_STATIC = 347;
    constants.T_ABSTRACT = 346;
    constants.T_FINAL = 345;
    constants.T_PRIVATE = 344;
    constants.T_PROTECTED = 343;
    constants.T_PUBLIC = 342;
    constants.T_VAR = 348;
    constants.T_UNSET = 349;
    constants.T_ISSET = 350;
    constants.T_EMPTY = 351;
    constants.T_HALT_COMPILER = 352;
    constants.T_CLASS = 353;
    //constants.T_TRAIT = ;
    constants.T_INTERFACE = 354;
    constants.T_EXTENDS = 355;
    constants.T_IMPLEMENTS = 356;
    constants.T_OBJECT_OPERATOR = 357;
    constants.T_DOUBLE_ARROW = 358;
    constants.T_LIST = 359;
    constants.T_ARRAY = 360;
    //constants.T_CALLABLE = ;
    constants.T_CLASS_C = 361;
    //constants.T_TRAIT_C = ;
    constants.T_METHOD_C = 362;
    constants.T_FUNC_C = 363;
    constants.T_LINE = 364;
    constants.T_FILE = 365;
    constants.T_COMMENT = 366;
    constants.T_DOC_COMMENT = 367;
    constants.T_OPEN_TAG = 368;
    constants.T_OPEN_TAG_WITH_ECHO = 369;
    constants.T_CLOSE_TAG = 370;
    constants.T_WHITESPACE = 371;
    constants.T_START_HEREDOC = 372;
    constants.T_END_HEREDOC = 373;
    constants.T_DOLLAR_OPEN_CURLY_BRACES = 374;
    constants.T_CURLY_OPEN = 375;
    constants.T_DOUBLE_COLON = 376;
    constants.T_PAAMAYIM_NEKUDOTAYIM = 376;
    constants.T_NAMESPACE = 377;
    constants.T_NS_C = 378;
    constants.T_DIR = 379;
    constants.T_NS_SEPARATOR = 380;
    
    
 
    for (var key in constants) {
        if (constants[ key ] === token[ PHP.Compiler.prototype.VARIABLE_VALUE ]) {
            return new PHP.VM.Variable( key );
        }
    }
    
    return new PHP.VM.Variable( "UNKNOWN" );
    
 
    
    

};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 6.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.empty = function() {

    var len = arguments.length, i = -1, arg,
    VARIABLE = PHP.VM.Variable.prototype;

    while( ++i < len ) {
        arg = arguments[ i ];
          console.log(arg); 
        // http://www.php.net/manual/en/types.comparisons.php
        if ( arg[ VARIABLE.TYPE ] === VARIABLE.NULL ) {
          
            return new PHP.VM.Variable( true );
        }

      
        
    }

    return new PHP.VM.Variable( false );

};
/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 4.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.is_callable = function( callback ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype;
    
    if ( callback[ VARIABLE.TYPE ] === VARIABLE.ARRAY ) {
        var Class = callback[ COMPILER.VARIABLE_VALUE ][ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 0 )[ COMPILER.VARIABLE_VALUE ],
        methodName = callback[ COMPILER.VARIABLE_VALUE ][ COMPILER.METHOD_CALL ]( this, COMPILER.ARRAY_GET, 1 )[ COMPILER.VARIABLE_VALUE ];
        
        return new PHP.VM.Variable( typeof Class[ PHP.VM.Class.METHOD + methodName] === "function" );
             
    } else {
           console.log( callback );
    }
    
 
    
};PHP.Modules.prototype.isset = function() {

    var len = arguments.length, i = -1, arg,
    VARIABLE = PHP.VM.Variable.prototype;

    while( ++i < len ) {
        arg = arguments[ i ];
        
        // http://www.php.net/manual/en/types.comparisons.php
        if ( arg[ VARIABLE.TYPE ] === VARIABLE.NULL ) {
            return new PHP.VM.Variable( false );
        }

        
    }

    return new PHP.VM.Variable( true );

};

/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 26.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.print_r = function() {
    
    var str = "",
    indent = 0,
    COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    
    var $dump = function( argument, indent ) {
        var str = "";
        if ( argument[ VAR.TYPE ] === VAR.ARRAY ) {
            str += $INDENT( indent ) + "array(";

            var values = argument[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.VALUES ][ COMPILER.VARIABLE_VALUE ];
            var keys = argument[ COMPILER.VARIABLE_VALUE ][ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.KEYS ][ COMPILER.VARIABLE_VALUE ];
            
            str += values.length;
       
            str += ") {\n";
            
            keys.forEach(function( key, index ){
                str += $INDENT( indent + 2 ) + "[";
                if ( typeof key === "string" ) {
                    str += '"' + key + '"';
                } else {
                    str += key;
                } 
                str += "]=>\n";
                
                str += $dump( values[ index ], indent + 2 );
                
            }, this);
            
            str += $INDENT( indent ) + "}\n";
        } else if( argument[ VAR.TYPE ] === VAR.NULL ) {
            str += $INDENT( indent ) + "NULL\n";  
        } else if( argument[ VAR.TYPE ] === VAR.STRING ) {
            
            var value = argument[ COMPILER.VARIABLE_VALUE ];
            str += $INDENT( indent ) + "string(" + value.length + ') "' + value + '"\n';  
        } else if( argument[ VAR.TYPE ] === VAR.INT ) {
            
            var value = argument[ COMPILER.VARIABLE_VALUE ];
            str += $INDENT( indent ) + "int(" + value + ')\n';  
            
        } else {
            console.log( argument );
        }
    
        return str;
    }, 
    $INDENT = function( num ) {
        var str = "", i ;
        for (i = 0; i < num; i++) {
            str += " ";
        }
        return str;
    };
    
    PHP.Utils.$A( arguments ).forEach( function( argument ) {
        str += $dump( argument, 0 );    
    }, this );
    
    this.echo( str );
    
    
  
// console.log(arguments);
/*
    console.log( arguments[0].type);
    console.log( arguments[0] instanceof PHP.VM.VariableProto);
    console.log( arguments );
    */
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 1.7.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.unset = function() {
    
  PHP.Utils.$A( arguments ).forEach(function( arg ){
      arg[ PHP.Compiler.prototype.UNSET ]();
  }, this );  
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 26.6.2012 
* @website http://hertzen.com
 */


PHP.Modules.prototype.var_dump = function() {
    
    var str = "",
    indent = 0,
    COMPILER = PHP.Compiler.prototype,
    VAR = PHP.VM.Variable.prototype;
    
    var $dump = function( argument, indent ) {
        var str = "",
        value = argument[ COMPILER.VARIABLE_VALUE ]; // trigger get for undefined
        if ( argument[ VAR.TYPE ] === VAR.ARRAY ) {
            str += $INDENT( indent ) + "array(";

            var values = value[ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.VALUES ][ COMPILER.VARIABLE_VALUE ];
            var keys = value[ PHP.VM.Class.PROPERTY + PHP.VM.Array.prototype.KEYS ][ COMPILER.VARIABLE_VALUE ];
            
            str += values.length;
       
            str += ") {\n";
            
            keys.forEach(function( key, index ){
                
                if (key instanceof PHP.VM.Variable) {
                    key = key[ COMPILER.VARIABLE_VALUE ];
                }
                
                str += $INDENT( indent + 2 ) + "[";
                if ( typeof key === "string" ) {
                    str += '"' + key + '"';
                } else {
                    str += key;
                } 
                str += "]=>\n";
               
                str += $dump( values[ index ], indent + 2 );
                
            }, this);
            
            str += $INDENT( indent ) + "}\n";
        } else if( argument[ VAR.TYPE ] === VAR.NULL ) {
            
            str += $INDENT( indent ) + "NULL\n";  
        } else if( argument[ VAR.TYPE ] === VAR.BOOL ) {    
            str += $INDENT( indent ) + "bool(" + value + ")\n";  
        } else if( argument[ VAR.TYPE ] === VAR.STRING ) {
            
            str += $INDENT( indent ) + "string(" + value.length + ') "' + value + '"\n';  
        } else if( argument[ VAR.TYPE ] === VAR.INT ) {
            
            value = argument[ COMPILER.VARIABLE_VALUE ];
            str += $INDENT( indent ) + "int(" + value + ')\n';  
        } else if( argument instanceof PHP.VM.ClassPrototype || argument[ VAR.TYPE ] === VAR.OBJECT ) {
            // todo, complete
            if( argument[ VAR.TYPE ] === VAR.OBJECT ) {
                argument = value;
            }
            
            str += $INDENT( indent ) + "object(" + argument[ COMPILER.CLASS_NAME ] + ')#1 ';
            
            var props = [];
            
            // search whole prototype chain
            for ( var item in argument ) {
                if (item.substring(0, PHP.VM.Class.PROPERTY.length) === PHP.VM.Class.PROPERTY) {
                    props.push( item );
                }
            }
         
            
            str += '(' + props.length + ') {\n';
            
            props.forEach(function( prop ){
                str += $INDENT( indent + 2 ) + '["' + prop.substring( PHP.VM.Class.PROPERTY.length ) + '"]=>\n';
                str += $dump( argument[ prop ], indent + 2 );
            });
            
            str += '}\n';  
        } else if( argument[ VAR.TYPE ] === VAR.FLOAT ) {
            str += $INDENT( indent ) + "float(" + value + ')\n';      
        } else {
            console.log( argument );
        }
    
        return str;
    }, 
    $INDENT = function( num ) {
        var str = "", i ;
        for (i = 0; i < num; i++) {
            str += " ";
        }
        return str;
    };
    
    PHP.Utils.$A( arguments ).forEach( function( argument ) {
        str += $dump( argument, 0 );    
    }, this );
    
    this.echo( str );
    
    
  
// console.log(arguments);
/*
    console.log( arguments[0].type);
    console.log( arguments[0] instanceof PHP.VM.VariableProto);
    console.log( arguments );
    */
};PHP.Lexer = function( src ) {
    
    
    var heredoc,
    lineBreaker = function( result ) {
        if (result.match(/\n/) !== null) {
            var quote = result.substring(0, 1);
            result = '[' + result.split(/\n/).join( quote + "," + quote ) + '].join("\\n")';
                
        }
        
        return result;
    },
   
    tokens = [
    {
        value: PHP.Constants.T_ABSTRACT,
        re: /^abstract(?=\s)/i
    },
    {
        value: PHP.Constants.T_IMPLEMENTS,
        re: /^implements(?=\s)/i
    },
    {
        value: PHP.Constants.T_INTERFACE,
        re: /^interface(?=\s)/i
    },
    {
        value: PHP.Constants.T_CONST,
        re: /^const(?=\s)/i
    },
    {
        value: PHP.Constants.T_STATIC,
        re: /^static(?=\s)/i
    },
        {
        value: PHP.Constants.T_FINAL,
        re: /^final(?=\s)/i
    },
    {
        value: PHP.Constants.T_GLOBAL,
        re: /^global(?=\s)/i
    },
    {
        value: PHP.Constants.T_CLONE,
        re: /^clone(?=\s)/i
    },
    {
        value: PHP.Constants.T_THROW,
        re: /^throw(?=\s)/i
    },
    {
        value: PHP.Constants.T_EXTENDS,
        re: /^extends(?=\s)/i
    },
    {
        value: PHP.Constants.T_AND_EQUAL,
        re: /^&=/
    },
    {
        value: PHP.Constants.T_AS,
        re: /^as(?=\s)/i
    },
    {
        value: PHP.Constants.T_ARRAY_CAST,
        re: /^\(array\)/i
    },
    {
        value: PHP.Constants.T_BOOL_CAST,
        re: /^\((bool|boolean)\)/i
    },
    {
        value: PHP.Constants.T_DOUBLE_CAST,
        re: /^\((real|float|double)\)/i
    },
    {
        value: PHP.Constants.T_INT_CAST,
        re: /^\((int|integer)\)/i
    },
    {
        value: PHP.Constants.T_OBJECT_CAST,
        re: /^\(object\)/i
    },
    {
        value: PHP.Constants.T_STRING_CAST,
        re: /^\(string\)/i
    },
    {
        value: PHP.Constants.T_UNSET_CAST,
        re: /^\(unset\)/i
    },
    {
        value: PHP.Constants.T_TRY,
        re: /^try(?=\s{)/i
    },
    {
        value: PHP.Constants.T_CATCH,
        re: /^catch(?=\s\()/i
    },
    {
        value: PHP.Constants.T_INSTANCEOF,
        re: /^instanceof(?=\s)/i
    },
    {
        value: PHP.Constants.T_BOOLEAN_AND,
        re: /^&&/
    },
    {
        value: PHP.Constants.T_BOOLEAN_OR,
        re: /^\|\|/
    },
    {
        value: PHP.Constants.T_CONTINUE,
        re: /^continue(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_BREAK,
        re: /^break(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDDECLARE,
        re: /^enddeclare(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDFOR,
        re: /^endfor(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDFOREACH,
        re: /^endforeach(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDIF,
        re: /^endif(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDSWITCH,
        re: /^endswitch(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_ENDWHILE,
        re: /^endwhile(?=\s|;)/i
    },
    {
        value: PHP.Constants.T_CASE,
        re: /^case(?=\s)/i
    },
    {
        value: PHP.Constants.T_DEFAULT,
        re: /^default(?=\s|:)/i
    },
    {
        value: PHP.Constants.T_SWITCH,
        re: /^switch(?=[ (])/i
    },
    {
        value: PHP.Constants.T_EXIT,
        re: /^(exit|die)(?=[ \(;])/i
    },
    {
        value: PHP.Constants.T_CLOSE_TAG,
        re: /^(\?\>|\%\>)/,
        func: function( result ) {
            insidePHP = false;
            return result;
        }
    },
    {
        value: PHP.Constants.T_DOUBLE_ARROW,
        re: /^\=\>/
    },
    {
        value: PHP.Constants.T_DOUBLE_COLON,
        re: /^\:\:/
    },
    {
        value: PHP.Constants.T_METHOD_C,
        re: /^__METHOD__/
    },
    {
        value: PHP.Constants.T_LINE,
        re: /^__LINE__/
    },
    {
        value: PHP.Constants.T_FILE,
        re: /^__FILE__/
    },
    {
        value: PHP.Constants.T_FUNC_C,
        re: /^__FUNCTION__/
    },
    {
        value: PHP.Constants.T_NS_C,
        re: /^__NAMESPACE__/
    },
    {
        value: PHP.Constants.T_TRAIT_C,
        re: /^__TRAIT__/
    },
    {
        value: PHP.Constants.T_DIR,
        re: /^__DIR__/
    },
    {
        value: PHP.Constants.T_CLASS_C,
        re: /^__CLASS__/
    },
    {
        value: PHP.Constants.T_INC,
        re: /^\+\+/
    },  
    {
        value: PHP.Constants.T_DEC,
        re: /^\-\-/
    },  
    {
        value: PHP.Constants.T_CONCAT_EQUAL,
        re: /^\.\=/
    },  
    {
        value: PHP.Constants.T_DIV_EQUAL,
        re: /^\/\=/
    },
    {
        value: PHP.Constants.T_XOR_EQUAL,
        re: /^\^\=/
    },
    {
        value: PHP.Constants.T_MUL_EQUAL,
        re: /^\*\=/
    },
    {
        value: PHP.Constants.T_MOD_EQUAL,
        re: /^\%\=/
    },
    {
        value: PHP.Constants.T_SL_EQUAL,
        re: /^<<=/
    }, 
    {
        value: PHP.Constants.T_START_HEREDOC,
        re: /^<<<[A-Z_0-9]+\s/i,
        func: function( result ){
            heredoc = result.substring(3, result.length - 1);
            return result;
        }
    },  
    {
        value: PHP.Constants.T_SL,
        re: /^<</
    },
    {
        value: PHP.Constants.T_IS_SMALLER_OR_EQUAL,
        re: /^<=/
    },
    {
        value: PHP.Constants.T_SR_EQUAL,
        re: /^>>=/
    }, 
    {
        value: PHP.Constants.T_SR,
        re: /^>>/
    },
    {
        value: PHP.Constants.T_IS_GREATER_OR_EQUAL,
        re: /^>=/
    },
    {
        value: PHP.Constants.T_OR_EQUAL,
        re: /^\|\=/
    },
    {
        value: PHP.Constants.T_PLUS_EQUAL,
        re: /^\+\=/
    },
    {
        value: PHP.Constants.T_MINUS_EQUAL,
        re: /^-\=/
    },
    {
        value: PHP.Constants.T_OBJECT_OPERATOR,
        re: /^\-\>/i
    }, 
    {
        value: PHP.Constants.T_CLASS,
        re: /^class(?=[\s\{])/i
    },
    {
        value: PHP.Constants.T_PUBLIC,
        re: /^public(?=[\s])/i
    },
    {
        value: PHP.Constants.T_PRIVATE,
        re: /^private(?=[\s])/i
    },
    {
        value: PHP.Constants.T_PROTECTED,
        re: /^protected(?=[\s])/i
    },
    {
        value: PHP.Constants.T_ARRAY,
        re: /^array(?=[ \(])/i
    },
    {
        value: PHP.Constants.T_ISSET,
        re: /^isset(?=[ \(])/i
    },
    {
        value: PHP.Constants.T_UNSET,
        re: /^unset(?=[ \(])/i
    },
    {
        value: PHP.Constants.T_RETURN,
        re: /^return(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_FUNCTION,
        re: /^function(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_ECHO,
        re: /^echo(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_PRINT,
        re: /^print(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_INCLUDE,
        re: /^include(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_INCLUDE_ONCE,
        re: /^include_once(?=[ "'(;])/i
    },
    {
        value: PHP.Constants.T_NEW,
        re: /^new(?=[ ])/i
    },
    {
        value: PHP.Constants.T_COMMENT,
        re: /^\/\*(.|\s)*?\*\//
    }, 
    {
        value: PHP.Constants.T_COMMENT,
        re: /^\/\/.*(\s)?/
    }, 
    {
        value: PHP.Constants.T_COMMENT,
        re: /^\#.*(\s)?/
    },   
    {
        value: PHP.Constants.T_ELSEIF,
        re: /^elseif(?=[\s(])/i
    },
    {
        value: PHP.Constants.T_ELSE,
        re: /^else(?=[\s{])/i
    },
    {
        value: PHP.Constants.T_IF,
        re: /^if(?=[\s(])/i
    },
    {
        value: PHP.Constants.T_DO,
        re: /^do(?=[ {])/i
    },
    {
        value: PHP.Constants.T_WHILE,
        re: /^while(?=[ (])/i
    },
    {
        value: PHP.Constants.T_FOREACH,
        re: /^foreach(?=[ (])/i
    },
    {
        value: PHP.Constants.T_ISSET,
        re: /^isset(?=[ (])/i
    },
    {
        value: PHP.Constants.T_IS_IDENTICAL,
        re: /^===/
    },
    {
        value: PHP.Constants.T_IS_EQUAL,
        re: /^==/
    },
    {
        value: PHP.Constants.T_IS_NOT_IDENTICAL,
        re: /^\!==/
    },
    {
        value: PHP.Constants.T_IS_NOT_EQUAL,
        re: /^(\!=|\<\>)/
    },
    {
        value: PHP.Constants.T_FOR,
        re: /^for(?=[ (])/i
    },
    {
        value: PHP.Constants.T_DNUMBER,
        re: /^[0-9]*\.[0-9]+([eE][-]?[0-9]*)?/
    /*,
        func: function( result ) {
           
            // transform e to E - token_get_all_variation1.phpt
            return (result - 0).toString().toUpperCase();
        }*/
        
    },
    {
        value: PHP.Constants.T_LNUMBER,
        re: /^(0x[0-9A-F]+|[0-9]+)/i
    },
    {
        value: PHP.Constants.T_OPEN_TAG_WITH_ECHO,
        re: /^(\<\?=|\<%=)/i
    },
    {
        value: PHP.Constants.T_OPEN_TAG,
        re: /^(\<\?php\s|\<\?|\<%)/i
    },
    {
        value: PHP.Constants.T_VARIABLE,
        re: /^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/
    },
    {
        value: PHP.Constants.T_WHITESPACE,
        re: /^\s+/
    },
    {
        value: PHP.Constants.T_CONSTANT_ENCAPSED_STRING,
        re: /^("(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*')/,
        func: function( result, token ) {

            var curlyOpen = 0;
          
            if (result.substring( 0,1 ) === "'") {
                return result;
            }
           
            var match = result.match( /(?:[^\\]|\\.)*[^\\]\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/g );
            if ( match !== null ) {
               
                while( result.length > 0 ) {

                    match = result.match( /^[\[\]\;\:\?\(\)\!\.\,\>\<\=\+\-\/\*\|\&\{\}\@\^\%\"\']/ );
                    
                    if ( match !== null ) {
                        results.push( match[ 0 ] );
                        result = result.substring( 1 );
                        
                        if ( curlyOpen > 0 && match[ 0 ] === "}") {
                            curlyOpen--;
                        }
                        
                    }
                    
                    match = result.match(/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/);
                    
                   
                    
                    if ( match !== null ) {
                        
                        results.push([
                            parseInt(PHP.Constants.T_VARIABLE, 10), 
                            match[ 0 ],
                            line
                            ]);
                        
                        result = result.substring( match[ 0 ].length ); 

                    }
                    

                    while(( match = result.match( /^([^\\\$"{}]|\\.)+/g )) !== null ) {
                   

                        if (result.length === 1) {
                            throw new Error(match);
                        }
                        
                        
                       
                        results.push([
                            parseInt(( curlyOpen > 0 ) ? PHP.Constants.T_CONSTANT_ENCAPSED_STRING : PHP.Constants.T_ENCAPSED_AND_WHITESPACE, 10), 
                            match[ 0 ].replace(/\n/g,"\\n").replace(/\r/g,""),
                            line
                            ]);
                           
                        line += match[ 0 ].split('\n').length - 1;
                   
                        result = result.substring( match[ 0 ].length );           
                            
                    }         
                
                    if( result.match(/^{\$/) !== null ) {
                        results.push([
                            parseInt(PHP.Constants.T_CURLY_OPEN, 10), 
                            "{",
                            line
                            ]);
                        result = result.substring( 1 );
                        curlyOpen++;
                    }
                }
                
                return undefined;
            //   console.log( result );
            } else {
                result = result.replace(/\n/g,"\\n").replace(/\r/g,"");
            }
         
            /*
            if (result.match(/\r\n/) !== null) {
                var quote = result.substring(0, 1);
                
                result = '[' + result.split(/\r\n/).join( quote + "," + quote ) + '].join("\\n")';
                
            }
             */
            return result;
        }
    },
    {
        value: PHP.Constants.T_STRING,
        re: /^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/
    },
    {
        value: -1,
        re: /^[\[\]\;\:\?\(\)\!\.\,\>\<\=\+\-\/\*\|\&\{\}\@\^\%\"\'\$]/
    }];

    
    var results = [],
    line = 1,
    insidePHP = false,
    cancel = true;
    
    if ( src === null ) {
        return results;
    }
    
    if ( typeof src !== "string" ) {
        src = src.toString();
    }
    

   
    while (src.length > 0 && cancel === true) {

        if ( insidePHP === true ) {
        
            if ( heredoc !== undefined ) {
                // we are in a heredoc
                
                var regexp = new RegExp('([\\S\\s]*)(\\r\\n|\\n|\\r)(' + heredoc + ')(;|\\r\\n|\\n)',"i");
                
                
                
                var result = src.match( regexp );
                if ( result !== null ) {
                    // contents

                    var tmp = result[ 1 ].replace(/^\n/g,"").replace(/\\\$/g,"$");
                    
                    
                    results.push([
                        parseInt(PHP.Constants.T_ENCAPSED_AND_WHITESPACE, 10), 
                        result[ 1 ].replace(/^\n/g,"").replace(/\\\$/g,"$") + "\n",
                        line
                        ]);
                        
                        
                    // note the no - 1 for length as regexp include one line as well   
                    line += result[ 1 ].split('\n').length;
                     
                    // heredoc end tag
                    results.push([
                        parseInt(PHP.Constants.T_END_HEREDOC, 10), 
                        result[ 3 ],
                        line
                        ]);
                        
                    src = src.substring( result[1].length + result[2].length + result[3].length );   
                    heredoc = undefined;
                }
                
                if (result === null) {
                    throw Error("sup");
                }
               
                
            } else {
                cancel =  tokens.some(function( token ){
        
                    var result = src.match( token.re );
        
                    if ( result !== null ) {
                        if ( token.value !== -1) {
                            var resultString = result[ 0 ];
                        
                        
                        
                            if (token.func !== undefined ) {
                                resultString = token.func( resultString, token );
                            }
                            if (resultString !== undefined ) {
                                
                                results.push([
                                    parseInt(token.value, 10), 
                                    resultString,
                                    line
                                    ]);
                                line += resultString.split('\n').length - 1;
                            }
                        
                        } else {
                            // character token
                            results.push( result[ 0 ] );
                        }
                
                        src = src.substring(result[ 0 ].length);
                        //  console.log(result);
                        return true;
                    }
                    return false;
        
        
                });
            }
        
        } else {
   
            var result = /(\<\?php\s|\<\?|\<%)/i.exec( src );
            //console.log('sup', result, result.index);
            if ( result !== null ) {
                if ( result.index > 0 ) {
                    var resultString = src.substring(0, result.index);
                    results.push ([
                        parseInt(PHP.Constants.T_INLINE_HTML, 10), 
                        resultString,
                        line
                        ]);
                     
                    line += resultString.split('\n').length - 1;
                     
                    src = src.substring( result.index );
                }

                insidePHP = true;
            } else {
                
                results.push ([
                    parseInt(PHP.Constants.T_INLINE_HTML, 10), 
                    src,
                    line
                    ]);
                return results;
            }
            
        //    src = src.substring(result[ 0 ].length);
        
        }

        
        
    }
    
    
    
    return results;
        
    

};

/*
 * @author Niklas von Hertzen <niklas at hertzen.com>
 * @created 15.6.2012
 * @website http://hertzen.com
 */

/*
 * The skeleton for this parser was written by Moriyoshi Koizumi and is based on
 * the work by Masato Bito and is in the PUBLIC DOMAIN.
 * Ported to JavaScript by Niklas von Hertzen
 */

PHP.Parser = function ( tokens, eval ) {

    var yybase = this.yybase,
    yydefault = this.yydefault,
    yycheck = this.yycheck,
    yyaction = this.yyaction,
    yylen = this.yylen,
    yygbase = this.yygbase,
    yygcheck = this.yygcheck,
    yyp = this.yyp,
    yygoto = this.yygoto,
    yylhs = this.yylhs,
    terminals = this.terminals,
    translate = this.translate,
    yygdefault = this.yygdefault;
    
    this.tokens = tokens;
    this.pos = -1;
    this.line = 1;

    this.tokenMap = this.createTokenMap( );

    this.dropTokens = {};
    this.dropTokens[ T_WHITESPACE ] = 1;
    this.dropTokens[ T_OPEN_TAG ] = 1;


    // We start off with no lookahead-token
    var tokenId = this.TOKEN_NONE;

    // The attributes for a node are taken from the first and last token of the node.
    // From the first token only the startAttributes are taken and from the last only
    // the endAttributes. Both are merged using the array union operator (+).
    this.startAttributes = {
        'startLine': 1
    };

    this.endAttributes = {};

    // In order to figure out the attributes for the starting token, we have to keep
    // them in a stack
    var attributeStack = [ this.startAttributes ];

    // Start off in the initial state and keep a stack of previous states
    var state = 0;
    var stateStack = [ state ];

    // AST stack
    this.yyastk = [];

    // Current position in the stack(s)
    this.stackPos  = 0;

    var yyn;

    var origTokenId;


    for (;;) {

        if ( yybase[ state ] === 0 ) {
            yyn = yydefault[ state ];
        } else {
            if (tokenId === this.TOKEN_NONE ) {

                // fetch the next token id from the lexer and fetch additional info by-ref

                origTokenId = this.getNextToken( );

                // map the lexer token id to the internally used token id's
                tokenId = (origTokenId >= 0 && origTokenId < this.TOKEN_MAP_SIZE) ? translate[ origTokenId ] : this.TOKEN_INVALID;
                //    console.log(origTokenId,tokenId);
                if (tokenId === this.TOKEN_INVALID) {
                    console.log('The lexer returned an invalid token',
                        origTokenId, this.tokenValue);
                /*
                    throw new RangeException(sprintf(
                    'The lexer returned an invalid token (id=%d, value=%s)',
                    origTokenId, tokenValue
                ));*/
                }

                attributeStack[ this.stackPos ] = this.startAttributes;
            }

            if (((yyn = yybase[ state ] + tokenId) >= 0
                && yyn < this.YYLAST && yycheck[ yyn ] === tokenId
                || (state < this.YY2TBLSTATE
                    && (yyn = yybase[state + this.YYNLSTATES] + tokenId) >= 0
                    && yyn < this.YYLAST
                    && yycheck[ yyn ] === tokenId))
            && (yyn = yyaction[ yyn ]) !== YYDEFAULT ) {
                /*
                 * >= YYNLSTATE: shift and reduce
                 * > 0: shift
                 * = 0: accept
                 * < 0: reduce
                 * = -YYUNEXPECTED: error
                 */
                if (yyn > 0) {
                    /* shift */
                    ++this.stackPos;

                    stateStack[ this.stackPos ] = state = yyn;
                    this.yyastk[ this.stackPos ] = this.tokenValue;
                    attributeStack[ this.stackPos ] = this.startAttributes;
                    tokenId = this.TOKEN_NONE;

                    if (yyn < this.YYNLSTATES)
                        continue;

                    /* $yyn >= YYNLSTATES means shift-and-reduce */
                    yyn -= this.YYNLSTATES;
                } else {
                    yyn = -yyn;
                }
            } else {
                yyn = yydefault[ state ];
            }
        }

        for (;;) {
            /* reduce/error */

            if ( yyn === 0 ) {
                /* accept */
                //  console.log(this.yyastk);
                return this.yyval;
            } else if (yyn !== this.YYUNEXPECTED ) {
                /* reduce */
                try {
                    //    console.log('yyn' + yyn);
                    this['yyn' + yyn](
                        PHP.Utils.Merge(attributeStack[this.stackPos - yylen[ yyn ] ], this.endAttributes)
                        //      + endAttributes
                        );
                } catch (e) {
                    /*
                        if (-1 === $e->getRawLine()) {
                            $e->setRawLine($startAttributes['startLine']);
                        }
                     */
                    throw e;
                }

                /* Goto - shift nonterminal */
                this.stackPos -= yylen[ yyn ];
                yyn = yylhs[ yyn ];
                if ((yyp = yygbase[ yyn ] + stateStack[ this.stackPos ]) >= 0
                    && yyp < this.YYGLAST
                    && yygcheck[ yyp ] === yyn) {
                    state = yygoto[ yyp ];
                } else {
                    state = yygdefault[ yyn ];
                }

                ++this.stackPos;

                stateStack[ this.stackPos ] = state;
                this.yyastk[ this.stackPos ] = this.yyval;
                attributeStack[ this.stackPos ] = this.startAttributes;
            } else {
                /* error */

                console.log(this.yyastk);
                console.log( tokens );
                if (eval !== true) {
                    throw new Error('Unexpected token ' + terminals[ tokenId ] + ", tokenId " + tokenId + " line " + this.startAttributes['startLine']);
                } else {
                    return this.startAttributes['startLine'];
                }

            }

            if (state < this.YYNLSTATES)
                break;
            /* >= YYNLSTATES means shift-and-reduce */
            yyn = state - this.YYNLSTATES;
        }
    }
    console.log(tokens);
};

PHP.Parser.prototype.MODIFIER_PUBLIC    =  1;
PHP.Parser.prototype.MODIFIER_PROTECTED =  2;
PHP.Parser.prototype.MODIFIER_PRIVATE   =  4;
PHP.Parser.prototype.MODIFIER_STATIC    =  8;
PHP.Parser.prototype.MODIFIER_ABSTRACT  = 16;
PHP.Parser.prototype.MODIFIER_FINAL     = 32;

PHP.Parser.prototype.TOKEN_NONE    = -1;
PHP.Parser.prototype.TOKEN_INVALID = 149;

PHP.Parser.prototype.TOKEN_MAP_SIZE = 384;

PHP.Parser.prototype.YYLAST       = 913;
PHP.Parser.prototype.YY2TBLSTATE  = 328;
PHP.Parser.prototype.YYGLAST      = 415;
PHP.Parser.prototype.YYNLSTATES   = 544;
PHP.Parser.prototype.YYUNEXPECTED = 32767;
PHP.Parser.prototype.YYDEFAULT    = -32766;

PHP.Parser.prototype.YYERRTOK = 256;
PHP.Parser.prototype.T_INCLUDE = 257;
PHP.Parser.prototype.T_INCLUDE_ONCE = 258;
PHP.Parser.prototype.T_EVAL = 259;
PHP.Parser.prototype.T_REQUIRE = 260;
PHP.Parser.prototype.T_REQUIRE_ONCE = 261;
PHP.Parser.prototype.T_LOGICAL_OR = 262;
PHP.Parser.prototype.T_LOGICAL_XOR = 263;
PHP.Parser.prototype.T_LOGICAL_AND = 264;
PHP.Parser.prototype.T_PRINT = 265;
PHP.Parser.prototype.T_PLUS_EQUAL = 266;
PHP.Parser.prototype.T_MINUS_EQUAL = 267;
PHP.Parser.prototype.T_MUL_EQUAL = 268;
PHP.Parser.prototype.T_DIV_EQUAL = 269;
PHP.Parser.prototype.T_CONCAT_EQUAL = 270;
PHP.Parser.prototype.T_MOD_EQUAL = 271;
PHP.Parser.prototype.T_AND_EQUAL = 272;
PHP.Parser.prototype.T_OR_EQUAL = 273;
PHP.Parser.prototype.T_XOR_EQUAL = 274;
PHP.Parser.prototype.T_SL_EQUAL = 275;
PHP.Parser.prototype.T_SR_EQUAL = 276;
PHP.Parser.prototype.T_BOOLEAN_OR = 277;
PHP.Parser.prototype.T_BOOLEAN_AND = 278;
PHP.Parser.prototype.T_IS_EQUAL = 279;
PHP.Parser.prototype.T_IS_NOT_EQUAL = 280;
PHP.Parser.prototype.T_IS_IDENTICAL = 281;
PHP.Parser.prototype.T_IS_NOT_IDENTICAL = 282;
PHP.Parser.prototype.T_IS_SMALLER_OR_EQUAL = 283;
PHP.Parser.prototype.T_IS_GREATER_OR_EQUAL = 284;
PHP.Parser.prototype.T_SL = 285;
PHP.Parser.prototype.T_SR = 286;
PHP.Parser.prototype.T_INSTANCEOF = 287;
PHP.Parser.prototype.T_INC = 288;
PHP.Parser.prototype.T_DEC = 289;
PHP.Parser.prototype.T_INT_CAST = 290;
PHP.Parser.prototype.T_DOUBLE_CAST = 291;
PHP.Parser.prototype.T_STRING_CAST = 292;
PHP.Parser.prototype.T_ARRAY_CAST = 293;
PHP.Parser.prototype.T_OBJECT_CAST = 294;
PHP.Parser.prototype.T_BOOL_CAST = 295;
PHP.Parser.prototype.T_UNSET_CAST = 296;
PHP.Parser.prototype.T_NEW = 297;
PHP.Parser.prototype.T_CLONE = 298;
PHP.Parser.prototype.T_EXIT = 299;
PHP.Parser.prototype.T_IF = 300;
PHP.Parser.prototype.T_ELSEIF = 301;
PHP.Parser.prototype.T_ELSE = 302;
PHP.Parser.prototype.T_ENDIF = 303;
PHP.Parser.prototype.T_LNUMBER = 304;
PHP.Parser.prototype.T_DNUMBER = 305;
PHP.Parser.prototype.T_STRING = 306;
PHP.Parser.prototype.T_STRING_VARNAME = 307;
PHP.Parser.prototype.T_VARIABLE = 308;
PHP.Parser.prototype.T_NUM_STRING = 309;
PHP.Parser.prototype.T_INLINE_HTML = 310;
PHP.Parser.prototype.T_CHARACTER = 311;
PHP.Parser.prototype.T_BAD_CHARACTER = 312;
PHP.Parser.prototype.T_ENCAPSED_AND_WHITESPACE = 313;
PHP.Parser.prototype.T_CONSTANT_ENCAPSED_STRING = 314;
PHP.Parser.prototype.T_ECHO = 315;
PHP.Parser.prototype.T_DO = 316;
PHP.Parser.prototype.T_WHILE = 317;
PHP.Parser.prototype.T_ENDWHILE = 318;
PHP.Parser.prototype.T_FOR = 319;
PHP.Parser.prototype.T_ENDFOR = 320;
PHP.Parser.prototype.T_FOREACH = 321;
PHP.Parser.prototype.T_ENDFOREACH = 322;
PHP.Parser.prototype.T_DECLARE = 323;
PHP.Parser.prototype.T_ENDDECLARE = 324;
PHP.Parser.prototype.T_AS = 325;
PHP.Parser.prototype.T_SWITCH = 326;
PHP.Parser.prototype.T_ENDSWITCH = 327;
PHP.Parser.prototype.T_CASE = 328;
PHP.Parser.prototype.T_DEFAULT = 329;
PHP.Parser.prototype.T_BREAK = 330;
PHP.Parser.prototype.T_CONTINUE = 331;
PHP.Parser.prototype.T_GOTO = 332;
PHP.Parser.prototype.T_FUNCTION = 333;
PHP.Parser.prototype.T_CONST = 334;
PHP.Parser.prototype.T_RETURN = 335;
PHP.Parser.prototype.T_TRY = 336;
PHP.Parser.prototype.T_CATCH = 337;
PHP.Parser.prototype.T_THROW = 338;
PHP.Parser.prototype.T_USE = 339;
PHP.Parser.prototype.T_INSTEADOF = 340;
PHP.Parser.prototype.T_GLOBAL = 341;
PHP.Parser.prototype.T_STATIC = 342;
PHP.Parser.prototype.T_ABSTRACT = 343;
PHP.Parser.prototype.T_FINAL = 344;
PHP.Parser.prototype.T_PRIVATE = 345;
PHP.Parser.prototype.T_PROTECTED = 346;
PHP.Parser.prototype.T_PUBLIC = 347;
PHP.Parser.prototype.T_VAR = 348;
PHP.Parser.prototype.T_UNSET = 349;
PHP.Parser.prototype.T_ISSET = 350;
PHP.Parser.prototype.T_EMPTY = 351;
PHP.Parser.prototype.T_HALT_COMPILER = 352;
PHP.Parser.prototype.T_CLASS = 353;
PHP.Parser.prototype.T_TRAIT = 354;
PHP.Parser.prototype.T_INTERFACE = 355;
PHP.Parser.prototype.T_EXTENDS = 356;
PHP.Parser.prototype.T_IMPLEMENTS = 357;
PHP.Parser.prototype.T_OBJECT_OPERATOR = 358;
PHP.Parser.prototype.T_DOUBLE_ARROW = 359;
PHP.Parser.prototype.T_LIST = 360;
PHP.Parser.prototype.T_ARRAY = 361;
PHP.Parser.prototype.T_CALLABLE = 362;
PHP.Parser.prototype.T_CLASS_C = 363;
PHP.Parser.prototype.T_TRAIT_C = 364;
PHP.Parser.prototype.T_METHOD_C = 365;
PHP.Parser.prototype.T_FUNC_C = 366;
PHP.Parser.prototype.T_LINE = 367;
PHP.Parser.prototype.T_FILE = 368;
PHP.Parser.prototype.T_COMMENT = 369;
PHP.Parser.prototype.T_DOC_COMMENT = 370;
PHP.Parser.prototype.T_OPEN_TAG = 371;
PHP.Parser.prototype.T_OPEN_TAG_WITH_ECHO = 372;
PHP.Parser.prototype.T_CLOSE_TAG = 373;
PHP.Parser.prototype.T_WHITESPACE = 374;
PHP.Parser.prototype.T_START_HEREDOC = 375;
PHP.Parser.prototype.T_END_HEREDOC = 376;
PHP.Parser.prototype.T_DOLLAR_OPEN_CURLY_BRACES = 377;
PHP.Parser.prototype.T_CURLY_OPEN = 378;
PHP.Parser.prototype.T_PAAMAYIM_NEKUDOTAYIM = 379;
PHP.Parser.prototype.T_NAMESPACE = 380;
PHP.Parser.prototype.T_NS_C = 381;
PHP.Parser.prototype.T_DIR = 382;
PHP.Parser.prototype.T_NS_SEPARATOR = 383;










PHP.Parser.prototype.getNextToken = function( ) {

    this.startAttributes = {};
    this.endAttributes = {};

    var token,
    tmp;

    while (this.tokens[++this.pos] !== undefined) {
        token = this.tokens[this.pos];

        if (typeof token === "string") {
            this.startAttributes['startLine'] = this.line;
            this.endAttributes['endLine'] = this.line;

            // bug in token_get_all
            if ('b"' === token) {
                this.tokenValue = 'b"';
                return '"'.charCodeAt(0);
            } else {
                this.tokenValue = token;
                return token.charCodeAt(0);
            }
        } else {



            this.line += ((tmp = token[ 1 ].match(/\\n/g)) === null) ? 0 : tmp.length;

            if (T_COMMENT === token[0]) {

                if (!Array.isArray(this.startAttributes['comments'])) {
                    this.startAttributes['comments'] = [];
                }

                this.startAttributes['comments'].push( {
                    type: "comment",
                    comment: token[1],
                    line: token[2]
                });

            } else if (T_DOC_COMMENT === token[0]) {
                this.startAttributes['comments'].push( new PHPParser_Comment_Doc(token[1], token[2]) );
            } else if (this.dropTokens[token[0]] === undefined) {
                //      console.log(this.pos, token);
                //     console.log(this.tokenMap);
                this.tokenValue = token[1];
                this.startAttributes['startLine'] = token[2];
                this.endAttributes['endLine'] = this.line;

                return this.tokenMap[token[0]];
            }
        }
    }

    this.startAttributes['startLine'] = this.line;

    // 0 is the EOF token
    return 0;
};


/**
 * Creates the token map.
 *
 * The token map maps the PHP internal token identifiers
 * to the identifiers used by the PHP.Parser. Additionally it
 * maps T_OPEN_TAG_WITH_ECHO to T_ECHO and T_CLOSE_TAG to ';'.
 *
 * @return array The token map
 */

PHP.Parser.prototype.createTokenMap = function() {
    var tokenMap = {},
    name,
    i;

    // 256 is the minimum possible token number, as everything below
    // it is an ASCII value
    for ( i = 256; i < 1000; ++i ) {
        // T_DOUBLE_COLON is equivalent to T_PAAMAYIM_NEKUDOTAYIM
        if ( T_DOUBLE_COLON === i ) {
            tokenMap[ i ] = this.T_PAAMAYIM_NEKUDOTAYIM;
        // T_OPEN_TAG_WITH_ECHO with dropped T_OPEN_TAG results in T_ECHO
        } else if( T_OPEN_TAG_WITH_ECHO === i ) {
            tokenMap[ i ] = T_ECHO;
        // T_CLOSE_TAG is equivalent to ';'
        } else if( T_CLOSE_TAG === i ) {
            tokenMap[ i ] = 59;
        // and the others can be mapped directly
        } else if ( 'UNKNOWN' !== (name = PHP.Utils.TokenName( i ) ) ) {
            tokenMap[ i ] =  this[name];
        }
    }
    return tokenMap;
};

var yynStandard = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};
// todo fix

PHP.Parser.prototype.MakeArray = function( arr ) {
    return Array.isArray( arr ) ? arr : [ arr ];
}


PHP.Parser.prototype.parseString = function( str ) {
    var bLength = 0;
    if ('b' === str[0]) {
        bLength = 1;
    }

    if ('\'' === str[ bLength ]) {
        str = str.replace(
            ['\\\\', '\\\''],
            [  '\\',   '\'']);
    } else {
     
        str = this.parseEscapeSequences( str, '"');

    }

    return str;
  
};

PHP.Parser.prototype.parseEscapeSequences = function( str, quote ) {
    
  

    if (undefined !== quote) {
        str = str.replace(new RegExp('\\' + quote, "g"), quote);
    }

    var replacements = {
        '\\': '\\',
        '$':  '$',
        'n': "\n",
        'r': "\r",
        't': "\t",
        'f': "\f",
        'v': "\v",
        'e': "\x1B"
    };

    return str.replace(
        /~\\\\([\\\\$nrtfve]|[xX][0-9a-fA-F]{1,2}|[0-7]{1,3})~/g,
        function ( matches ){
            var str = matches[1];

            if ( replacements[ str ] !== undefined ) {
                return replacements[ str ];
            } else if ('x' === str[ 0 ] || 'X' === str[ 0 ]) {
                return chr(hexdec(str));
            } else {
                return chr(octdec(str));
            }
        }
        );
    
    return str;
};
/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 2.7.2012 
* @website http://hertzen.com
 */



PHP.Parser.prototype.terminals = [
    "EOF",
    "error",
    "T_INCLUDE",
    "T_INCLUDE_ONCE",
    "T_EVAL",
    "T_REQUIRE",
    "T_REQUIRE_ONCE",
    "','",
    "T_LOGICAL_OR",
    "T_LOGICAL_XOR",
    "T_LOGICAL_AND",
    "T_PRINT",
    "'='",
    "T_PLUS_EQUAL",
    "T_MINUS_EQUAL",
    "T_MUL_EQUAL",
    "T_DIV_EQUAL",
    "T_CONCAT_EQUAL",
    "T_MOD_EQUAL",
    "T_AND_EQUAL",
    "T_OR_EQUAL",
    "T_XOR_EQUAL",
    "T_SL_EQUAL",
    "T_SR_EQUAL",
    "'?'",
    "':'",
    "T_BOOLEAN_OR",
    "T_BOOLEAN_AND",
    "'|'",
    "'^'",
    "'&'",
    "T_IS_EQUAL",
    "T_IS_NOT_EQUAL",
    "T_IS_IDENTICAL",
    "T_IS_NOT_IDENTICAL",
    "'<'",
    "T_IS_SMALLER_OR_EQUAL",
    "'>'",
    "T_IS_GREATER_OR_EQUAL",
    "T_SL",
    "T_SR",
    "'+'",
    "'-'",
    "'.'",
    "'*'",
    "'/'",
    "'%'",
    "'!'",
    "T_INSTANCEOF",
    "'~'",
    "T_INC",
    "T_DEC",
    "T_INT_CAST",
    "T_DOUBLE_CAST",
    "T_STRING_CAST",
    "T_ARRAY_CAST",
    "T_OBJECT_CAST",
    "T_BOOL_CAST",
    "T_UNSET_CAST",
    "'@'",
    "'['",
    "T_NEW",
    "T_CLONE",
    "T_EXIT",
    "T_IF",
    "T_ELSEIF",
    "T_ELSE",
    "T_ENDIF",
    "T_LNUMBER",
    "T_DNUMBER",
    "T_STRING",
    "T_STRING_VARNAME",
    "T_VARIABLE",
    "T_NUM_STRING",
    "T_INLINE_HTML",
    "T_ENCAPSED_AND_WHITESPACE",
    "T_CONSTANT_ENCAPSED_STRING",
    "T_ECHO",
    "T_DO",
    "T_WHILE",
    "T_ENDWHILE",
    "T_FOR",
    "T_ENDFOR",
    "T_FOREACH",
    "T_ENDFOREACH",
    "T_DECLARE",
    "T_ENDDECLARE",
    "T_AS",
    "T_SWITCH",
    "T_ENDSWITCH",
    "T_CASE",
    "T_DEFAULT",
    "T_BREAK",
    "T_CONTINUE",
    "T_GOTO",
    "T_FUNCTION",
    "T_CONST",
    "T_RETURN",
    "T_TRY",
    "T_CATCH",
    "T_THROW",
    "T_USE",
    "T_INSTEADOF",
    "T_GLOBAL",
    "T_STATIC",
    "T_ABSTRACT",
    "T_FINAL",
    "T_PRIVATE",
    "T_PROTECTED",
    "T_PUBLIC",
    "T_VAR",
    "T_UNSET",
    "T_ISSET",
    "T_EMPTY",
    "T_HALT_COMPILER",
    "T_CLASS",
    "T_TRAIT",
    "T_INTERFACE",
    "T_EXTENDS",
    "T_IMPLEMENTS",
    "T_OBJECT_OPERATOR",
    "T_DOUBLE_ARROW",
    "T_LIST",
    "T_ARRAY",
    "T_CALLABLE",
    "T_CLASS_C",
    "T_TRAIT_C",
    "T_METHOD_C",
    "T_FUNC_C",
    "T_LINE",
    "T_FILE",
    "T_START_HEREDOC",
    "T_END_HEREDOC",
    "T_DOLLAR_OPEN_CURLY_BRACES",
    "T_CURLY_OPEN",
    "T_PAAMAYIM_NEKUDOTAYIM",
    "T_NAMESPACE",
    "T_NS_C",
    "T_DIR",
    "T_NS_SEPARATOR",
    "';'",
    "'{'",
    "'}'",
    "'('",
    "')'",
    "'$'",
    "']'",
    "'`'",
    "'\"'",
    "???"
    ];


/* @var Map which translates lexer tokens to internal tokens */
PHP.Parser.prototype.translate = [
    0,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,   47,  148,  149,  145,   46,   30,  149,
    143,  144,   44,   41,    7,   42,   43,   45,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,   25,  140,
    35,   12,   37,   24,   59,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,   60,  149,  146,   29,  149,  147,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  141,   28,  142,   49,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,  149,  149,  149,  149,
    149,  149,  149,  149,  149,  149,    1,    2,    3,    4,
    5,    6,    8,    9,   10,   11,   13,   14,   15,   16,
    17,   18,   19,   20,   21,   22,   23,   26,   27,   31,
    32,   33,   34,   36,   38,   39,   40,   48,   50,   51,
    52,   53,   54,   55,   56,   57,   58,   61,   62,   63,
    64,   65,   66,   67,   68,   69,   70,   71,   72,   73,
    74,  149,  149,   75,   76,   77,   78,   79,   80,   81,
    82,   83,   84,   85,   86,   87,   88,   89,   90,   91,
    92,   93,   94,   95,   96,   97,   98,   99,  100,  101,
    102,  103,  104,  105,  106,  107,  108,  109,  110,  111,
    112,  113,  114,  115,  116,  117,  118,  119,  120,  121,
    122,  123,  124,  125,  126,  127,  128,  129,  130,  149,
    149,  149,  149,  149,  149,  131,  132,  133,  134,  135,
    136,  137,  138,  139
    ];

PHP.Parser.prototype.yyaction = [
    61,   62,  363,   63,   64,-32766,-32766,-32766,  509,   65,
    708,  709,  710,  707,  706,  705,-32766,-32766,-32766,-32766,
    -32766,-32766,  132,-32766,-32766,-32766,-32766,-32766,-32767,-32767,
    -32767,-32767,-32766,  351,-32766,-32766,-32766,-32766,-32766,   66,
    67,  335,  663,  664,   41,   68,  548,   69,  232,  233,
    70,   71,   72,   73,   74,   75,   76,   77,   30,  246,
    78,  336,  364, -112,    0,  469,  833,  834,  365,  641,
    890,  446,  590,  126,  835,   53,   27,  366,  294,  367,
    687,  368,  921,  369,  923,  922,  370,-32766,-32766,-32766,
    42,   43,  371,  339,  275,   44,  372,  337,   79,  361,
    297,  292,  293,-32766,  918,-32766,-32766,  373,  374,  375,
    376,  377,  391,   40,  349,  338,  573,  613,  378,  379,
    380,  381,  845,  839,  840,  841,  842,  836,  837,  253,
    -32766,   87,   88,   89,  391,  843,  838,  338,  597,  519,
    128,   80,  129,  273,  698,  257,  261,   47,  890,   90,
    91,   92,   93,   94,   95,   96,   97,   98,   99,  100,
    101,  102,  103,  104,  105,  106,  107,  108,  109,  110,
    21,  247,  884,  108,  109,  110,  238,  247,  799,-32766,
    310,-32766,-32766,-32766,  642,  548,-32766,-32766,-32766,-32766,
    56,  353,-32766,-32766,-32766,   58,-32766,-32766,-32766,-32766,
    -32766,   55,-32766,-32766,-32766,-32766,-32766,-32766,-32766,-32766,
    -32766,  557,-32766,-32766,  518,-32766,  548,  673,-32766,  390,
    -32766,  273,  227,-32766,-32766,-32766,-32766,-32766,  199,-32766,
    234,-32766,  682,  587,-32766,-32766,-32766,-32766,-32766,-32766,
    -32766,   46,  236,-32766,-32766,  281,-32766,  588,  348,-32766,
    390,-32766,  346,  333,  521,-32766,-32766,-32766,  271,  911,
    262,  237,  894,  911,-32766,  436,   59,  700,  358,  202,
    548,  123,  538,   35,-32766,  333,  124,-32766,-32766,-32766,
    271,-32766,  122,-32766,  692,-32766,-32766,-32766,-32766,  700,
    228,   22,-32766,-32766,-32766,-32766,  239,-32766,-32766,  611,
    -32766,  548,  134,-32766,  390,-32766,  462,  354,-32766,-32766,
    -32766,-32766,-32766,  252,-32766,  226,-32766,  845,  133,-32766,
    856,  612,  200,-32766,-32766,-32766,  259,  280,-32766,-32766,
    135,-32766,  855,  130,-32766,  390,  129,  207,  333,  206,
    -32766,-32766,-32766,  271,-32766,-32766,-32766,  125,  601,-32766,
    136,  299,  700,  498,  499,  548,  105,  106,  107,-32766,
    489,   28,-32766,-32766,-32766,  201,-32766,  525,-32766,  527,
    -32766,-32766,-32766,-32766,  663,  664,  532,-32766,-32766,-32766,
    -32766,  539,-32766,-32766,  610,-32766,  548,  427,-32766,  390,
    -32766,  528,  542,-32766,-32766,-32766,-32766,-32766,  608,-32766,
    247,-32766,  686,  535,-32766,  697,  543,  240,-32766,-32766,
    -32766,  554,  523,-32766,-32766,   57,-32766,   54,   60,-32766,
    390,  246, -155,  279,  402,-32766,-32766,-32766,  506,  694,
    243,  471,  848,  564,-32766,  916,  404,  272,  493,  562,
    548,  318,  549,  548,-32766,  517,  347,-32766,-32766,-32766,
    505,-32766,  417,-32766,  416,-32766,-32766,-32766,-32766,  405,
    826,  403,-32766,-32766,-32766,-32766,  345,-32766,-32766,  802,
    -32766,  548,  504,-32766,  390,-32766,  485,  487,-32766,-32766,
    -32766,-32766,-32766,  278,-32766,  911,-32766,  502,  492,-32766,
    413,  483,  269,-32766,-32766,-32766,  418,  337,-32766,-32766,
    229,-32766, -152,  454,-32766,  390,  274,  373,  374,  360,
    -32766,-32766,-32766,  344,  614,-32766,  573,  613,  378,  379,
    312,  548,  615,  260,  844,-32766,  258,  578,-32766,-32766,
    -32766,  270,-32766,  346,-32766,  629,-32766, -332,    0,-32766,
    -333,  583,-32766,-32766,-32766,-32766,-32766,  205,-32766,-32766,
    49,-32766,  548,  424,-32766,  390,-32766,  264, -266,-32766,
    -32766,-32766,-32766,-32766,  343,-32766,  409,-32766,  513, -275,
    -32766, -274,  265,  470,-32766,-32766,-32766,  885,  337,-32766,
    -32766,  591,-32766,  592,  635,-32766,  390,   51,  373,  374,
    576,-32766,-32766,-32766,  644,  600,-32766,  573,  613,  378,
    379,  586,  548,   52,  691,  683,-32766,  558,  690,-32766,
    -32766,-32766,  589,-32766,  693,-32766,  625,-32766,  203,  204,
    -32766,  530,  581,-32766,-32766,-32766,-32766,  531,  627,-32766,
    -32766,  599,-32766,  582,  584,-32766,  390,  197,  636,  675,
    86,  520,  522,-32766,  127,  833,  834,  524,  541,-32766,
    529,  537,  534,  835,   48,  111,  112,  113,  114,  115,
    116,  117,  118,  119,  120,  121,  533,  331,  824,  337,
    330,  887,  585,-32766,   34,  291,  337,  330,  875,  373,
    374,  633,  291,  634,  919,  920,  373,  374,  553,  613,
    378,  379,  737,  739,  889,  553,  613,  378,  379,  891,
    451,  895,  839,  840,  841,  842,  836,  837,  320,  917,
    277,  478,  774,   32,  843,  838,  556,  277,  337,  330,
    -32766,   31,-32766,  555,  291,-32766,  131,  198,  373,  374,
    137,   33,  138,  224,  225,  230,  231,  553,  613,  378,
    379,-32767,-32767,-32767,-32767,  103,  104,  105,  106,  107,
    337,  235,  248,  249,  337,  250,   85,   84,   83,  277,
    373,  374, -332,   82,  373,  374,  455,  337,  251,  573,
    613,  378,  379,  573,  613,  378,  379,  373,  374,   81,
    329,   36,   37,  337,   38,    0,  573,  613,  378,  379,
    50,   45,   39,  373,  374,  276,  337,  796,  490,  886,
    337,  795,  573,  613,  378,  379,  373,  374,  900,  457,
    373,  374,  827,  337,  609,  573,  613,  378,  379,  573,
    613,  378,  379,  373,  374,  516,  778,  770,  515,  480,
    574,  507,  573,  613,  378,  379,  805,  548,  337,  890,
    851,  872,  337,  332,  804,  823,  832,  604,  373,  374,
    915,  873,  373,  374,-32766,-32766,-32766,  573,  613,  378,
    379,  573,  613,  378,  379,  807,  806,  803,  791,  775,
    -32766,  809,-32766,-32766,-32766,-32766,  508,  482,  445,  359,
    355,  319,  300,   25,   24,   23,   20,    0,   26,   29,
    298,    0,    0,    0,  852,  869,  488,  870,  874,  888,
    808,  792,    0,  391,  793,    0,  338,    0,    0,    0,
    340,    0,  273
    ];

PHP.Parser.prototype.yycheck = [
    2,    3,    4,    5,    6,    8,    9,   10,   70,   11,
    104,  105,  106,  107,  108,  109,    8,    9,   10,    8,
    9,   24,   60,   26,   27,   28,   29,   30,   31,   32,
    33,   34,   24,    7,   26,   27,   28,   29,   30,   41,
    42,    7,  123,  124,    7,   47,   70,   49,   50,   51,
    52,   53,   54,   55,   56,   57,   58,   59,   60,   61,
    62,   63,   64,  144,    0,   75,   68,   69,   70,   25,
    72,   70,   74,    7,   76,   77,   78,   79,    7,   81,
    142,   83,   70,   85,   72,   73,   88,    8,    9,   10,
    92,   93,   94,   95,    7,   97,   98,   95,  100,    7,
    7,  103,  104,   24,  142,   26,   27,  105,  106,  111,
    112,  113,  136,    7,    7,  139,  114,  115,  116,  117,
    122,  123,  132,  125,  126,  127,  128,  129,  130,  131,
    8,    8,    9,   10,  136,  137,  138,  139,  140,  141,
    25,  143,  141,  145,  142,  147,  148,   24,   72,   26,
    27,   28,   29,   30,   31,   32,   33,   34,   35,   36,
    37,   38,   39,   40,   41,   42,   43,   44,   45,   46,
    144,   48,   72,   44,   45,   46,   30,   48,  144,   64,
    72,    8,    9,   10,  140,   70,    8,    9,   10,   74,
    60,   25,   77,   78,   79,   60,   81,   24,   83,   26,
    85,   60,   24,   88,   26,   27,   28,   92,   93,   94,
    64,  140,   97,   98,   70,  100,   70,   72,  103,  104,
    74,  145,    7,   77,   78,   79,  111,   81,    7,   83,
    30,   85,  140,  140,   88,    8,    9,   10,   92,   93,
    94,  133,  134,   97,   98,  145,  100,  140,    7,  103,
    104,   24,  139,   96,  141,  140,  141,  111,  101,   75,
    75,   30,   70,   75,   64,   70,   60,  110,  121,   12,
    70,  141,   25,  143,   74,   96,  141,   77,   78,   79,
    101,   81,  141,   83,  140,   85,  140,  141,   88,  110,
    145,  144,   92,   93,   94,   64,    7,   97,   98,  142,
    100,   70,  141,  103,  104,   74,  145,  141,   77,   78,
    79,  111,   81,    7,   83,   30,   85,  132,   25,   88,
    132,  142,   12,   92,   93,   94,  120,   60,   97,   98,
    12,  100,  148,  141,  103,  104,  141,   12,   96,   12,
    140,  141,  111,  101,    8,    9,   10,  141,   25,   64,
    90,   91,  110,   65,   66,   70,   41,   42,   43,   74,
    65,   66,   77,   78,   79,   12,   81,   25,   83,   25,
    85,  140,  141,   88,  123,  124,   25,   92,   93,   94,
    64,   25,   97,   98,  142,  100,   70,  120,  103,  104,
    74,   25,   25,   77,   78,   79,  111,   81,   30,   83,
    48,   85,  140,  141,   88,  140,  141,   30,   92,   93,
    94,  140,  141,   97,   98,   60,  100,   60,   60,  103,
    104,   61,   72,   75,   70,  140,  141,  111,   67,   70,
    87,   99,   70,   70,   64,   70,   72,  102,   89,   70,
    70,   71,   70,   70,   74,   70,   70,   77,   78,   79,
    70,   81,   70,   83,   70,   85,  140,  141,   88,   70,
    144,   70,   92,   93,   94,   64,   70,   97,   98,   72,
    100,   70,   72,  103,  104,   74,   72,   72,   77,   78,
    79,  111,   81,   75,   83,   75,   85,   89,   86,   88,
    79,  101,  118,   92,   93,   94,   87,   95,   97,   98,
    87,  100,   87,   87,  103,  104,  118,  105,  106,   95,
    140,  141,  111,   95,  115,   64,  114,  115,  116,  117,
    135,   70,  115,  120,  132,   74,  120,  140,   77,   78,
    79,  119,   81,  139,   83,  140,   85,  120,   -1,   88,
    120,  140,  141,   92,   93,   94,   64,  121,   97,   98,
    121,  100,   70,  122,  103,  104,   74,  135,  135,   77,
    78,   79,  111,   81,  139,   83,  139,   85,  135,  135,
    88,  135,  135,  135,   92,   93,   94,  142,   95,   97,
    98,  140,  100,  140,  140,  103,  104,  140,  105,  106,
    140,  140,  141,  111,  140,  140,   64,  114,  115,  116,
    117,  140,   70,  140,  140,  140,   74,  140,  140,   77,
    78,   79,  140,   81,  140,   83,  140,   85,   41,   42,
    88,  140,  140,  141,   92,   93,   94,  140,  140,   97,
    98,  140,  100,  140,  140,  103,  104,   60,  140,  142,
    141,  141,  141,  111,  141,   68,   69,  141,  141,   72,
    141,  141,  141,   76,   12,   13,   14,   15,   16,   17,
    18,   19,   20,   21,   22,   23,  141,  143,  142,   95,
    96,  142,  140,  141,  143,  101,   95,   96,  142,  105,
    106,  142,  101,  142,  142,  142,  105,  106,  114,  115,
    116,  117,   50,   51,  142,  114,  115,  116,  117,  142,
    123,  142,  125,  126,  127,  128,  129,  130,  131,  142,
    136,  142,  144,  143,  137,  138,  142,  136,   95,   96,
    143,  143,  145,  142,  101,  143,  143,  143,  105,  106,
    143,  143,  143,  143,  143,  143,  143,  114,  115,  116,
    117,   35,   36,   37,   38,   39,   40,   41,   42,   43,
    95,  143,  143,  143,   95,  143,  143,  143,  143,  136,
    105,  106,  120,  143,  105,  106,  144,   95,  143,  114,
    115,  116,  117,  114,  115,  116,  117,  105,  106,  143,
    143,  143,  143,   95,  143,   -1,  114,  115,  116,  117,
    143,  143,  143,  105,  106,  143,   95,  142,   80,  146,
    95,  142,  114,  115,  116,  117,  105,  106,  144,  144,
    105,  106,  144,   95,  142,  114,  115,  116,  117,  114,
    115,  116,  117,  105,  106,   82,  144,  144,  144,  144,
    142,   84,  114,  115,  116,  117,  144,   70,   95,   72,
    144,  144,   95,  142,  144,  146,  144,  142,  105,  106,
    146,  144,  105,  106,    8,    9,   10,  114,  115,  116,
    117,  114,  115,  116,  117,  144,  144,  144,  144,  144,
    24,  104,   26,   27,   28,   29,  144,  144,  144,  144,
    144,  144,  144,  144,  144,  144,  144,   -1,  144,  144,
    144,   -1,   -1,   -1,  146,  146,  146,  146,  146,  146,
    146,  146,   -1,  136,  147,   -1,  139,   -1,   -1,   -1,
    143,   -1,  145
    ];

PHP.Parser.prototype.yybase = [
    0,  574,  581,  623,  688,  701,  718,  402,  747,  672,
    659,  655,  743,  705,    2,  483,  483,  483,  483,  483,
    344,  366,  351,  351,  356,  351,  342,   -2,   -2,   -2,
    200,  200,  231,  231,  231,  231,  231,  231,  231,  231,
    200,  231,  482,  401,  532,  316,  370,  115,  285,  146,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,  451,
    451,  451,  451,  451,  451,  451,  451,  451,  451,   44,
    441,  429,  493,  494,  461,  491,  683,  682,  668,  744,
    742,  413,  746,  567,  557,  293,  552,  536,  529,  526,
    497,  569,  559,  685,  750,  435,  745,  684,  123,  123,
    123,  123,  123,  123,  123,  123,  123,  122,   11,  336,
    336,  336,  336,  336,  336,  336,  336,  336,  336,  336,
    336,  336,  336,  336,  227,  227,  173,  577,  577,  577,
    577,  577,  577,  577,  577,  577,  577,  577,   79,  178,
    846,    8,   -3,   -3,   -3,   -3,  642,  706,  706,  706,
    706,  179,  157,  242,  431,  431,  360,  431,  503,  377,
    767,  767,  767,  767,  767,  767,  767,  767,  767,  767,
    767,  767,  350,  375,  315,  315,  582,  582,  -81,  -81,
    -81,  -81,  251,  185,  188,  184,  -62,  408,  192,  192,
    192,  348,  392,  410,  195,    1,  129,  129,  129,  -24,
    -24,  -24,  -24,  499,  -24,  -24,  -24,  113,  108,  108,
    12,  161,  349,  539,  262,  398,  541,  434,  130,  206,
    271,  425,  145,  418,  425,  295,  288,  145,  166,   44,
    265,  423,  135,  472,  382,  467,  409,   71,   93,  107,
    267,  141,  100,   26,  416,  622,  568,  665,  -38,  420,
    -10,  141,  147,  664,  465,   92,   34,  468,  144,  368,
    391,  384,  332,  391,  405,  368,  648,  368,  373,  368,
    360,  106,  638,  373,  368,  374,  373,  388,  391,  364,
    412,  384,  368,  481,  487,  390,  221,  332,  368,  390,
    368,  405,   64,  636,  620,  323,  615,  647,  614,  524,
    613,  354,  500,  399,  407,  592,  593,  608,  389,  396,
    590,  578,  427,  376,  357,  422,  588,  531,  355,  406,
    418,  394,  352,  417,  570,  437,  417,  755,  385,  436,
    403,  411,  455,  310,  353,  501,  427,  737,  757,  372,
    609,  734,  417,  583,  447,   66,  257,  610,  369,  417,
    612,  417,  725,  506,  591,  417,  724,  365,  543,  427,
    352,  352,  352,  723,   37,  754,  639,  722,  721,  753,
    752,  707,  751,  641,  653,  358,  639,  702,  699,  736,
    306,  584,  423,  438,  363,  443,   87,  318,  704,  417,
    417,  509,  499,  417,  463,  733,  404,  426,  748,  392,
    362,  652,  735,  417,  414,  749,   87,  700,  649,  697,
    387,  741,  525,  637,  511,  327,  696,  325,  542,  587,
    454,  740,  395,  444,  400,  510,  380,  692,  589,  247,
    361,  739,  498,  397,  732,  625,  450,  488,  507,  415,
    433,  335,  343,  359,  738,  367,  476,  474,  464,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,    0,    0,    0,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,
    -2,   -2,   -2,  123,  123,  123,  123,  123,  123,  123,
    123,  123,  123,  123,  123,  123,  123,  123,  123,  123,
    123,  123,  123,  123,  123,  123,  123,  123,  123,  123,
    123,  123,    0,    0,    0,    0,    0,    0,    0,    0,
    0,  123,  123,  123,  123,  123,  123,  123,  123,  123,
    123,  123,  123,  123,  123,  123,  123,  123,  123,  123,
    123,  767,  767,  767,  767,  767,  767,  767,  767,  767,
    767,  767,  123,  123,  123,  123,  123,  123,  123,  123,
    0,  129,  129,  129,  129,  -94,  -94,  -94,  767,  767,
    767,  767,  767,  767,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,  -94,  -94,  129,  129,
    767,  767,  -24,  -24,  -24,  -24,  -24,  108,  108,  108,
    -24,  108,   76,   76,   76,  108,  108,  108,  100,  100,
    0,    0,    0,    0,    0,    0,    0,   76,    0,    0,
    0,  373,    0,    0,    0,   76,  260,  260,   87,  260,
    260,  141,    0,    0,  427,  373,    0,  364,  373,    0,
    0,    0,    0,    0,    0,  570,    0,   66,  609,  241,
    427,    0,    0,    0,    0,    0,    0,    0,  427,  289,
    289,  215,    0,  358,    0,    0,    0,  215,  241,    0,
    0,   87
    ];

PHP.Parser.prototype.yydefault = [
    3,32767,32767,    1,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,  104,   96,  110,   95,  106,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    358,  358,  122,  122,  122,  122,  122,  122,  122,  122,
    316,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    173,  173,  173,32767,  348,  348,  348,  348,  348,  348,
    348,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,  363,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,  232,  233,
    235,  236,  172,  125,  349,  362,  171,  199,  201,  250,
    200,  177,  182,  183,  184,  185,  186,  187,  188,  189,
    190,  191,  192,  176,  229,  228,  197,  313,  313,  316,
    32767,32767,32767,32767,32767,32767,32767,32767,  198,  202,
    204,  203,  219,  220,  217,  218,  175,  221,  222,  223,
    224,  157,  157,  157,  357,  357,32767,  357,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,  158,32767,  211,  212,  276,  276,  117,  117,
    117,  117,  117,32767,32767,32767,32767,  284,32767,32767,
    32767,32767,32767,  286,32767,32767,  206,  207,  205,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,  285,32767,
    32767,32767,32767,32767,32767,32767,32767,  334,  321,  272,
    32767,32767,32767,  265,32767,  107,  109,32767,32767,32767,
    32767,  302,  339,32767,32767,32767,   17,32767,32767,32767,
    370,  334,32767,32767,   19,32767,32767,32767,32767,  227,
    32767,  338,  332,32767,32767,32767,32767,32767,32767,   63,
    32767,32767,32767,32767,32767,   63,  281,   63,32767,   63,
    32767,  315,  287,32767,   63,   74,32767,   72,32767,32767,
    76,32767,   63,   93,   93,  254,  315,   54,   63,  254,
    63,32767,32767,32767,32767,    4,32767,32767,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,32767,  267,32767,  323,32767,  337,  336,  324,32767,
    265,32767,  215,  194,  266,32767,  196,32767,32767,  270,
    273,32767,32767,32767,  134,32767,  268,  180,32767,32767,
    32767,32767,  365,32767,32767,  174,32767,32767,32767,  130,
    32767,   61,  332,32767,32767,  355,32767,32767,  332,  269,
    208,  209,  210,32767,  121,32767,  310,32767,32767,32767,
    32767,32767,32767,  327,32767,  333,32767,32767,32767,32767,
    111,32767,  302,32767,32767,32767,   75,32767,32767,  178,
    126,32767,32767,  364,32767,32767,32767,  320,32767,32767,
    32767,32767,32767,   62,32767,32767,   77,32767,32767,32767,
    32767,  332,32767,32767,32767,  115,32767,  169,32767,32767,
    32767,32767,32767,32767,32767,32767,32767,32767,32767,32767,
    32767,  332,32767,32767,32767,32767,32767,32767,32767,    4,
    32767,  151,32767,32767,32767,32767,32767,32767,32767,   25,
    25,    3,  137,    3,  137,   25,  101,   25,   25,  137,
    93,   93,   25,   25,   25,  144,   25,   25,   25,   25,
    25,   25,   25,   25
    ];

PHP.Parser.prototype.yygoto = [
    141,  141,  173,  173,  173,  173,  173,  173,  173,  173,
    141,  173,  142,  143,  144,  148,  153,  155,  181,  175,
    172,  172,  172,  172,  174,  174,  174,  174,  174,  174,
    174,  168,  169,  170,  171,  179,  757,  758,  392,  760,
    781,  782,  783,  784,  785,  786,  787,  789,  725,  145,
    146,  147,  149,  150,  151,  152,  154,  177,  178,  180,
    196,  208,  209,  210,  211,  212,  213,  214,  215,  217,
    218,  219,  220,  244,  245,  266,  267,  268,  430,  431,
    432,  182,  183,  184,  185,  186,  187,  188,  189,  190,
    191,  192,  156,  157,  158,  159,  176,  160,  194,  161,
    162,  163,  164,  195,  165,  193,  139,  166,  167,  452,
    452,  452,  452,  452,  452,  452,  452,  452,  452,  452,
    453,  453,  453,  453,  453,  453,  453,  453,  453,  453,
    453,  552,  552,  552,  464,  491,  394,  394,  394,  394,
    394,  394,  394,  394,  394,  394,  394,  394,  394,  394,
    394,  394,  394,  394,  407,  551,  551,  551,  810,  810,
    662,  662,  662,  662,  662,  594,  283,  595,  510,  399,
    399,  567,  679,  632,  849,  850,  863,  660,  714,  426,
    222,  622,  622,  622,  622,  223,  617,  623,  494,  395,
    395,  395,  395,  395,  395,  395,  395,  395,  395,  395,
    395,  395,  395,  395,  395,  395,  395,  465,  472,  514,
    904,  398,  398,  425,  425,  459,  425,  419,  322,  421,
    421,  393,  396,  412,  422,  428,  460,  463,  473,  481,
    501,    5,  476,  284,  327,    1,   15,    2,    6,    7,
    550,  550,  550,    8,    9,   10,  668,   16,   11,   17,
    12,   18,   13,   19,   14,  704,  328,  400,  400,  643,
    628,  626,  626,  624,  626,  526,  401,  652,  647,  847,
    847,  847,  847,  847,  847,  847,  847,  847,  847,  847,
    437,  438,  441,  447,  477,  479,  497,  290,  910,  910,
    881,  881,  486,  880,  880,  263,  913,  910,  303,  255,
    723,  306,  822,  821,  306,  896,  896,  896,  861,  304,
    323,  410,  913,  913,  897,  316,  420,  769,  658,  559,
    879,  671,  536,  324,  466,  565,  311,  311,  311,  801,
    241,  676,  496,  439,  440,  442,  444,  448,  475,  631,
    858,  311,  285,  286,  603,  495,  712,    0,  406,  321,
    0,    0,    0,  314,    0,    0,  429,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,
    0,    0,    0,    0,  411
    ];

PHP.Parser.prototype.yygcheck = [
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   35,
    35,   35,   35,   35,   35,   35,   35,   35,   35,   35,
    86,   86,   86,   86,   86,   86,   86,   86,   86,   86,
    86,    7,    7,    7,   21,   21,   35,   35,   35,   35,
    35,   35,   35,   35,   35,   35,   35,   35,   35,   35,
    35,   35,   35,   35,   71,    6,    6,    6,   35,   35,
    35,   35,   35,   35,   35,   29,   44,   29,   35,   86,
    86,   12,   12,   12,   12,   12,   12,   12,   12,   75,
    40,   35,   35,   35,   35,   40,   35,   35,   35,   82,
    82,   82,   82,   82,   82,   82,   82,   82,   82,   82,
    82,   82,   82,   82,   82,   82,   82,   36,   36,   36,
    104,   82,   82,   28,   28,   28,   28,   28,   28,   28,
    28,   28,   28,   28,   28,   28,   28,   28,   28,   28,
    28,   13,   42,   42,   42,    2,   13,    2,   13,   13,
    5,    5,    5,   13,   13,   13,   54,   13,   13,   13,
    13,   13,   13,   13,   13,   67,   67,   89,   89,    5,
    5,    5,    5,    5,    5,    5,    5,    5,    5,   93,
    93,   93,   93,   93,   93,   93,   93,   93,   93,   93,
    52,   52,   52,   52,   52,   52,   52,    4,  105,  105,
    83,   83,   94,   84,   84,   92,  105,  105,   26,   92,
    71,    4,   91,   91,    4,   84,   84,   84,   97,   30,
    70,   30,  105,  105,  102,   27,   30,   72,   50,   10,
    84,   55,   46,    9,   30,   11,   90,   90,   90,   80,
    30,   56,   30,   85,   85,   85,   85,   85,   85,   43,
    96,   90,   44,   44,   34,   77,   69,   -1,    4,   90,
    -1,   -1,   -1,    4,   -1,   -1,    4,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,   -1,
    -1,   -1,   -1,   -1,   71
    ];

PHP.Parser.prototype.yygbase = [
    0,    0, -286,    0,   10,  239,  154,  130,    0,  -10,
    25,  -23,  -29, -289,    0,  -30,    0,    0,    0,    0,
    0,   83,    0,    0,    0,    0,  245,   84,  -11,  142,
    -28,    0,    0,    0,  -13,  -88,  -42,    0,    0,    0,
    -344,    0,  -38,  -12, -188,    0,   23,    0,    0,    0,
    66,    0,  247,    0,  205,   24,  -18,    0,    0,    0,
    0,    0,    0,    0,    0,    0,    0,   13,    0,  -15,
    85,   74,   70,    0,    0,  148,    0,  -14,    0,    0,
    -6,    0,  -35,   44,   47,  278,  -77,    0,    0,   11,
    68,   43,   38,   72,   94,    0,  -16,  109,    0,    0,
    0,    0,   87,    0,  170,   34,    0
    ];

PHP.Parser.prototype.yygdefault = [
    -32768,  362,    3,  546,  382,  570,  571,  572,  307,  305,
    560,  566,  467,    4,  568,  140,  295,  575,  296,  500,
    577,  414,  579,  580,  308,  309,  415,  315,  216,  593,
    503,  313,  596,  357,  602,  301,  449,  383,  350,  461,
    221,  423,  456,  630,  282,  638,  540,  646,  649,  450,
    657,  352,  433,  434,  667,  672,  677,  680,  334,  325,
    474,  684,  685,  256,  689,  511,  512,  703,  242,  711,
    317,  724,  342,  788,  790,  397,  408,  484,  797,  326,
    800,  384,  385,  386,  387,  435,  818,  815,  289,  866,
    287,  443,  254,  853,  468,  356,  903,  862,  288,  388,
    389,  302,  898,  341,  905,  912,  458
    ];

PHP.Parser.prototype.yylhs = [
    0,    1,    2,    2,    4,    4,    3,    3,    3,    3,
    3,    3,    3,    3,    3,    8,    8,   10,   10,   10,
    10,    9,    9,   11,   13,   13,   14,   14,   14,   14,
    5,    5,    5,    5,    5,    5,    5,    5,    5,    5,
    5,    5,    5,    5,    5,    5,    5,    5,    5,    5,
    5,    5,    5,    5,    5,    5,    5,    5,   33,   33,
    34,   27,   27,   30,   30,    6,    7,    7,    7,   37,
    37,   37,   38,   38,   41,   41,   39,   39,   42,   42,
    22,   22,   29,   29,   32,   32,   31,   31,   43,   23,
    23,   23,   23,   44,   44,   45,   45,   46,   46,   20,
    20,   16,   16,   47,   18,   18,   48,   17,   17,   19,
    19,   36,   36,   49,   49,   50,   50,   51,   51,   51,
    51,   52,   52,   53,   53,   54,   54,   24,   24,   55,
    55,   55,   25,   25,   56,   56,   40,   40,   57,   57,
    57,   57,   62,   62,   63,   63,   64,   64,   64,   64,
    65,   66,   66,   61,   61,   58,   58,   60,   60,   68,
    68,   67,   67,   67,   67,   67,   67,   59,   59,   69,
    69,   26,   26,   21,   21,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   15,   15,   15,   15,   15,   15,   15,
    15,   15,   15,   71,   77,   77,   79,   79,   80,   81,
    81,   81,   81,   81,   81,   86,   86,   35,   35,   35,
    72,   72,   87,   87,   82,   82,   88,   88,   88,   88,
    88,   73,   73,   73,   76,   76,   76,   78,   78,   93,
    93,   93,   93,   93,   93,   93,   93,   93,   93,   93,
    93,   93,   93,   12,   12,   12,   12,   12,   12,   74,
    74,   74,   74,   94,   94,   96,   96,   95,   95,   97,
    97,   28,   28,   28,   28,   99,   99,   98,   98,   98,
    98,   98,  100,  100,   84,   84,   89,   89,   83,   83,
    101,  101,  101,  101,   90,   90,   90,   90,   85,   85,
    91,   91,   91,   70,   70,  102,  102,  102,   75,   75,
    103,  103,  104,  104,  104,  104,   92,   92,   92,   92,
    105,  105,  105,  105,  105,  105,  105,  106,  106,  106
    ];

PHP.Parser.prototype.yylen = [
    1,    1,    2,    0,    1,    3,    1,    1,    1,    1,
    3,    5,    4,    3,    3,    3,    1,    1,    3,    2,
    4,    3,    1,    3,    2,    0,    1,    1,    1,    1,
    3,    7,   10,    5,    7,    9,    5,    2,    3,    2,
    3,    2,    3,    3,    3,    3,    1,    2,    5,    7,
    8,   10,    5,    1,    5,    3,    3,    2,    1,    2,
    8,    1,    3,    0,    1,    9,    7,    6,    5,    1,
    2,    2,    0,    2,    0,    2,    0,    2,    1,    3,
    1,    4,    1,    4,    1,    4,    1,    3,    3,    3,
    4,    4,    5,    0,    2,    4,    3,    1,    1,    1,
    4,    0,    2,    5,    0,    2,    6,    0,    2,    0,
    3,    1,    0,    1,    3,    3,    5,    0,    1,    1,
    1,    1,    0,    1,    3,    1,    2,    3,    1,    1,
    2,    4,    3,    1,    1,    3,    2,    0,    3,    3,
    8,    3,    1,    3,    0,    2,    4,    5,    4,    4,
    3,    1,    1,    1,    3,    1,    1,    0,    1,    1,
    2,    1,    1,    1,    1,    1,    1,    1,    3,    1,
    3,    3,    1,    0,    1,    1,    6,    3,    4,    4,
    1,    2,    3,    3,    3,    3,    3,    3,    3,    3,
    3,    3,    3,    2,    2,    2,    2,    3,    3,    3,
    3,    3,    3,    3,    3,    3,    3,    3,    3,    3,
    3,    3,    3,    2,    2,    2,    2,    3,    3,    3,
    3,    3,    3,    3,    3,    3,    3,    3,    5,    4,
    4,    4,    2,    2,    4,    2,    2,    2,    2,    2,
    2,    2,    2,    2,    2,    2,    1,    4,    3,    3,
    2,    9,   10,    3,    0,    4,    1,    3,    2,    4,
    6,    8,    4,    4,    4,    1,    1,    1,    2,    3,
    1,    1,    1,    1,    1,    1,    0,    3,    3,    4,
    4,    0,    2,    3,    0,    1,    1,    0,    3,    1,
    1,    1,    1,    1,    1,    1,    1,    1,    1,    1,
    3,    2,    1,    1,    3,    2,    2,    4,    3,    1,
    3,    3,    3,    0,    2,    0,    1,    3,    1,    3,
    1,    1,    1,    1,    1,    6,    4,    3,    6,    4,
    4,    4,    1,    3,    1,    2,    1,    1,    4,    1,
    3,    6,    4,    4,    4,    4,    1,    4,    0,    1,
    1,    3,    1,    3,    1,    1,    4,    0,    0,    2,
    3,    1,    3,    1,    4,    2,    2,    2,    1,    2,
    1,    4,    3,    3,    3,    6,    3,    1,    1,    1
    ];


PHP.Parser.prototype.yyn1 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};


PHP.Parser.prototype.yyn2 = function () {

    if (Array.isArray(this.yyastk[this.stackPos-(2-2)])) {
        this.yyval = PHP.Utils.Merge( this.yyastk[this.stackPos-(2-1)], this.yyastk[this.stackPos-(2-2)] );
    } else {
        this.yyastk[this.stackPos-(2-1)].push( this.yyastk[this.stackPos-(2-2)] );
        //  this.yyastk[this.stackPos-(2-1)] = PHP.Utils.Merge( this.yyastk[this.stackPos-(2-1)], this.yyastk[this.stackPos-(2-2)]);
        this.yyval = this.yyastk[this.stackPos-(2-1)];
    }

};

PHP.Parser.prototype.yyn3 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn4 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn5 = function () {
    if (!Array.isArray(this.yyastk[ this.stackPos-(3-1) ])) {
        this.yyastk[ this.stackPos-(3-1) ] = [ this.yyastk[ this.stackPos-(3-1) ] ];
    }
    this.yyastk[ this.stackPos-(3-1) ].push( this.yyastk[ this.stackPos-(3-3) ]);
    this.yyval =  this.yyastk[ this.stackPos-(3-1) ];
};

PHP.Parser.prototype.yyn6 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn7 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn8 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn9 = function ( attributes ) {

    // todo add halting code
    this.yyval =  {
        type: "Node_Stmt_HaltCompiler",
        attributes: attributes
    };
    
    this.pos = this.tokens.length;
};


PHP.Parser.prototype.yyn10 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Namespace",
        name: {
            parts: this.yyastk[ this.stackPos-(3-2) ],
            type: "Node_Name",
            attributes: attributes
        },
        stmts: [],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn11 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Namespace",
        name: {
            parts: this.yyastk[ this.stackPos-(5-2) ],
            type: "Node_Name",
            attributes: attributes
        },
        stmts: this.yyastk[ this.stackPos-(5-4) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn12 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Namespace",
        name: null,
        stmts: this.yyastk[ this.stackPos-(4-3) ],
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn13 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Use",
        uses: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn15 = function () {
    this.yyastk[ this.stackPos-(3-1) ].push( this.yyastk[ this.stackPos-(3-3) ] );
    this.yyval = this.yyastk[ this.stackPos-(3-1) ];
};

PHP.Parser.prototype.yyn16 = function () {
    this.yyval =  [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn17 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_UseUse",
        name: {
            parts: this.yyastk[ this.stackPos-(1-1) ],
            type: "Node_Name",
            attributes: attributes
        },
        alias: null,
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn18 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_UseUse",
        name: {
            parts: this.yyastk[ this.stackPos-(3-1) ],
            type: "Node_Name",
            attributes: attributes
        },
        alias: this.yyastk[ this.stackPos-(3-3) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn19 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_UseUse",
        name: {
            parts: this.yyastk[ this.stackPos-(2-2) ],
            type: "Node_Name",
            attributes: attributes
        },
        alias: null,
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn20 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_UseUse",
        name: {
            parts: this.yyastk[ this.stackPos-(4-2) ],
            type: "Node_Name",
            attributes: attributes
        },
        alias: this.yyastk[ this.stackPos-(4-4) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn21 = function () {
    this.yyastk[ this.stackPos-(3-1) ].push( this.yyastk[ this.stackPos-(3-3) ] );
    this.yyval =  [ this.yyastk[ this.stackPos-(3-1) ] ];
};

PHP.Parser.prototype.yyn22 = function () {
    this.yyval =  [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn23 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Const",
        name: this.yyastk[ this.stackPos-(3-1) ],
        value: this.yyastk[ this.stackPos-(3-3) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn24 = function () {
    if (Array.isArray(this.yyastk[this.stackPos-(2-2)])) {
        this.yyval = array_merge(this.yyastk[this.stackPos-(2-1)], this.yyastk[this.stackPos-(2-2)]);
    } else {
        this.yyastk[this.stackPos-(2-1)].push( this.yyastk[this.stackPos-(2-2)] );
        this.yyval = this.yyastk[this.stackPos-(2-1)];
    }

};

PHP.Parser.prototype.yyn25 = function () {
    this.yyval =  [];
};

PHP.Parser.prototype.yyn26 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn27 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn28 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn29 = function () {
    throw new Error('__halt_compiler() can only be used from the outermost scope');
};

PHP.Parser.prototype.yyn30 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn31 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_If",
        cond: this.yyastk[ this.stackPos-(7-3) ],
        stmts: (Array.isArray(this.yyastk[ this.stackPos-(7-5)])) ? this.yyastk[ this.stackPos-(7-5) ] : [ this.yyastk[ this.stackPos-(7-5) ] ],
        elseifs: this.yyastk[ this.stackPos-(7-6) ],
        Else: this.yyastk[ this.stackPos-(7-7) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn32 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_If",
        cond: this.yyastk[ this.stackPos-(10-3) ],
        stmts: this.yyastk[ this.stackPos-(10-6) ],
        elseifs: this.yyastk[ this.stackPos-(10-7) ],
        Else: this.yyastk[ this.stackPos-(10-8) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn33 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_While",
        cond: this.yyastk[ this.stackPos-(5-3) ],
        stmts: this.yyastk[ this.stackPos-(5-5) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn34 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Do",
        stmts: Array.isArray( this.yyastk[ this.stackPos-(7-2) ] ) ? this.yyastk[ this.stackPos-(7-2) ] : [ this.yyastk[ this.stackPos-(7-2) ] ],
        cond: this.yyastk[ this.stackPos-(7-5) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn35 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_For",
        init: this.yyastk[ this.stackPos-(9-3) ],
        cond: this.yyastk[ this.stackPos-(9-5) ],
        loop: this.yyastk[ this.stackPos-(9-7) ],
        stmts: this.yyastk[ this.stackPos-(9-9) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn36 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Switch",
        cond: this.yyastk[ this.stackPos-(5-3) ],
        cases: this.yyastk[ this.stackPos-(5-5) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn37 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Break",
        num: null,
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn38 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Break",
        num: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn39 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Continue",
        num: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn40 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Continue",
        num: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn41 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Return",
        expr: null,
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn42 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Return",
        expr: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn43 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Global",
        vars: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn44 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Static",
        vars: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn45 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Echo",
        exprs: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn46 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_InlineHTML",
        value: this.yyastk[ this.stackPos-(1-1) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn47 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn48 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Unset",
        variables: this.yyastk[ this.stackPos-(5-3) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn49 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Foreach",
        expr: this.yyastk[ this.stackPos-(7-3) ],
        valueVar: this.yyastk[ this.stackPos-(7-5) ],
        keyVar: null,
        byRef: false,
        stmts: this.yyastk[ this.stackPos-(7-7) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn50 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Foreach",
        expr: this.yyastk[ this.stackPos-(8-3) ],
        valueVar: this.yyastk[ this.stackPos-(8-6) ],
        keyVar: null,
        byRef: true,
        stmts: this.yyastk[ this.stackPos-(8-8) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn51 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Foreach",
        expr: this.yyastk[ this.stackPos-(10-3) ],
        valueVar: this.yyastk[ this.stackPos-(10-8) ],
        keyVar: this.yyastk[ this.stackPos-(10-5) ],
        byRef: this.yyastk[ this.stackPos-(10-7) ],
        stmts: this.yyastk[ this.stackPos-(10-10) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn52 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Declare",
        declares: this.yyastk[ this.stackPos-(5-3) ],
        stmts: this.yyastk[ this.stackPos-(5-5) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn53 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn54 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_TryCatch",
        stmts: this.yyastk[ this.stackPos-(5-3) ],
        catches: this.yyastk[ this.stackPos-(5-5) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn55 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Throw",
        expr: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn58 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn60 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Catch",
        Type: this.yyastk[ this.stackPos-(8-3) ],
        variable: this.yyastk[ this.stackPos-(8-4) ].substring(1),
        stmts: this.yyastk[ this.stackPos-(8-7) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn61 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn62 = function () {
    this.yyastk[this.stackPos-(3-1)].push( this.yyastk[this.stackPos-(3-3)] );
    this.yyval = this.yyastk[this.stackPos-(3-1)];
};

PHP.Parser.prototype.yyn63 = function () {
    this.yyval = false;
};

PHP.Parser.prototype.yyn64 = function () {
    this.yyval = true;
};

PHP.Parser.prototype.yyn65 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Function",
        byRef: this.yyastk[ this.stackPos-(9-2) ],
        name: this.yyastk[ this.stackPos-(9-3) ],
        params: this.yyastk[ this.stackPos-(9-5) ],
        stmts: this.yyastk[ this.stackPos-(9-8) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn66 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Class",
        Type: this.yyastk[ this.stackPos-(7-1) ],
        name: this.yyastk[ this.stackPos-(7-2) ],
        Extends: this.yyastk[ this.stackPos-(7-3) ],
        Implements: this.yyastk[ this.stackPos-(7-4) ],
        stmts: this.yyastk[ this.stackPos-(7-6) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn67 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Interface",
        name: this.yyastk[ this.stackPos-(6-2) ],
        Extends: this.yyastk[ this.stackPos-(6-3) ],
        stmts: this.yyastk[ this.stackPos-(6-5) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn69 = function () {
    this.yyval = 0;
};

PHP.Parser.prototype.yyn70 = function () {
    this.yyval = this.MODIFIER_ABSTRACT;
};

PHP.Parser.prototype.yyn71 = function () {
    this.yyval = this.MODIFIER_FINAL;
};

PHP.Parser.prototype.yyn72 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn73 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-2)];
};

PHP.Parser.prototype.yyn74 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn75 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-2)];
};

PHP.Parser.prototype.yyn76 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn77 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-2)];
};

PHP.Parser.prototype.yyn78 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn79 = function () {
    this.yyastk[this.stackPos-(3-1)].push( this.yyastk[this.stackPos-(3-3)] );
    this.yyval = [ this.yyastk[this.stackPos-(3-1)] ];
};

PHP.Parser.prototype.yyn80 = function () {
    this.yyval = this.MakeArray( this.yyastk[this.stackPos-(1-1)] );
};

PHP.Parser.prototype.yyn81 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-2)];
};

PHP.Parser.prototype.yyn82 = function () {
    this.yyval = this.MakeArray( this.yyastk[this.stackPos-(1-1)] );
};

PHP.Parser.prototype.yyn83 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-2)];
};

PHP.Parser.prototype.yyn84 = function () {
    this.yyval = this.MakeArray( this.yyastk[this.stackPos-(1-1)] );
};

PHP.Parser.prototype.yyn85 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-2)];
};

PHP.Parser.prototype.yyn86 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn88 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_DeclareDeclare",
        key: this.yyastk[ this.stackPos-(3-1) ],
        value: this.yyastk[ this.stackPos-(3-3) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn89 = function () {
    this.yyval = this.yyastk[this.stackPos-(3-2)];
};

PHP.Parser.prototype.yyn90 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-3)];
};

PHP.Parser.prototype.yyn91 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-2)];
};

PHP.Parser.prototype.yyn92 = function () {
    this.yyval = this.yyastk[this.stackPos-(5-3)];
};

PHP.Parser.prototype.yyn93 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn94 = function () {
    this.yyastk[this.stackPos-(2-1)].push( this.yyastk[this.stackPos-(2-2)] );
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn95 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Case",
        cond: this.yyastk[ this.stackPos-(4-2) ],
        stmts: this.yyastk[ this.stackPos-(4-4) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn96 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Case",
        cond: null,
        stmts: this.yyastk[ this.stackPos-(3-3) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn97 = function () {
    this.yyval = this.yyastk[this.stackPos];
};

PHP.Parser.prototype.yyn98 = function () {
    this.yyval = this.yyastk[this.stackPos];
};

PHP.Parser.prototype.yyn99 = function () {
    this.yyval = Array.isArray( this.yyastk[this.stackPos-(1-1)] ) ? this.yyastk[this.stackPos-(1-1)] : [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn100 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-2)];
};

PHP.Parser.prototype.yyn101 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn102 = function () {
    this.yyastk[this.stackPos-(2-1)].push( this.yyastk[this.stackPos-(2-2)] );
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn103 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Stmt_ElseIf",
        cond: this.yyastk[this.stackPos-(5-3)],
        stmts: Array.isArray( this.yyastk[ this.stackPos-(5-5) ] ) ? this.yyastk[ this.stackPos-(5-5) ] : [ this.yyastk[ this.stackPos-(5-5) ] ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn104 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn106 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Stmt_ElseIf",
        cond: this.yyastk[this.stackPos-(6-3)],
        stmts: this.yyastk[this.stackPos-(6-6)],
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn107 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn108 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Stmt_Else",
        stmts: Array.isArray( this.yyastk[ this.stackPos-(2-2) ] ) ? this.yyastk[ this.stackPos-(2-2) ] : [ this.yyastk[ this.stackPos-(2-2) ] ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn109 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn111 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn112 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn113 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn114 = function () {

    if (Array.isArray(this.yyastk[this.stackPos-(3-1)][0])) {
        this.yyastk[this.stackPos-(3-1)][0].push( this.yyastk[this.stackPos-(3-3)] );
        this.yyval = [ this.yyastk[this.stackPos-(3-1)] ][0];
    } else {
        this.yyastk[this.stackPos-(3-1)].push( this.yyastk[this.stackPos-(3-3)] );
        this.yyval = [ this.yyastk[this.stackPos-(3-1)] ];
    }

};

PHP.Parser.prototype.yyn115 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Param",
        def: null,
        Type: this.yyastk[ this.stackPos-(3-1) ],
        byRef: this.yyastk[ this.stackPos-(3-2) ],
        name: this.yyastk[ this.stackPos-(3-3) ].substring(1),
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn116 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Param",
        def: this.yyastk[ this.stackPos-(5-5) ],
        Type: this.yyastk[ this.stackPos-(5-1) ],
        byRef: this.yyastk[ this.stackPos-(5-2) ],
        name: this.yyastk[ this.stackPos-(5-3) ].substring(1),
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn117 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn118 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn119 = function () {
    this.yyval = 'array';
};

PHP.Parser.prototype.yyn120 = function () {
    this.yyval = 'callable';
};

PHP.Parser.prototype.yyn121 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn122 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn123 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn124 = function () {
    this.yyastk[this.stackPos-(3-1)].push( this.yyastk[this.stackPos-(3-3)] );

    this.yyval =  this.yyastk[this.stackPos-(3-1)] ;
};

PHP.Parser.prototype.yyn125 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Arg",
        byRef: false,
        value: this.yyastk[ this.stackPos-(1-1) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn126 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Arg",
        byRef: true,
        value: this.yyastk[ this.stackPos-(2-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn127 = function () {
    this.yyastk[this.stackPos-(3-1)].push(this.yyastk[this.stackPos-(3-3)]);
    this.yyval = [ this.yyastk[this.stackPos-(3-1)] ];
};

PHP.Parser.prototype.yyn128 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn129 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn130 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn131 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn132 = function () {
    this.yyastk[this.stackPos-(3-1)].push( this.yyastk[this.stackPos-(3-3)] );
    this.yyval = this.yyastk[this.stackPos-(3-1)];
};

PHP.Parser.prototype.yyn133 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn134 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        def: null,
        type: "Node_Stmt_StaticVar",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn135 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(3-1)].substring(1),
        def: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Stmt_StaticVar",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn136 = function () {
    this.yyastk[ this.stackPos-(2-1) ].push( this.yyastk[ this.stackPos-(2-2) ] );
    this.yyval = this.yyastk[ this.stackPos-(2-1) ];
};

PHP.Parser.prototype.yyn137 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn138 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_Property",
        Type: this.yyastk[ this.stackPos-(3-1) ],
        props: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn139 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_ClassConst",
        consts: this.yyastk[ this.stackPos-(3-2) ],
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn140 = function ( attributes ) {

    this.yyval =  {
        type: "Node_Stmt_ClassMethod",
        Type: this.yyastk[ this.stackPos-(8-1) ],
        byRef: this.yyastk[ this.stackPos-(8-3) ],
        name: this.yyastk[ this.stackPos-(8-4) ],
        params: this.yyastk[ this.stackPos-(8-6) ],
        stmts: this.yyastk[ this.stackPos-(8-8) ],
        attributes: attributes
    };

};

PHP.Parser.prototype.yyn142 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn143 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn144 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn150 = function () {
    this.yyval = [ this.yyastk[ this.stackPos-(3-1) ], this.yyastk[ this.stackPos-(3-3) ] ];
};

PHP.Parser.prototype.yyn151 = function () {
    this.yyval = this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn152 = function () {
    this.yyval = [ null, this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn153 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn154 = function () {
    this.yyval = this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn155 = function () {
    this.yyval = this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn156 = function () {
    this.yyval = this.MODIFIER_PUBLIC;
};

PHP.Parser.prototype.yyn157 = function () {
    this.yyval = this.MODIFIER_PUBLIC;
};

PHP.Parser.prototype.yyn158 = function () {
    this.yyval = [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn159 = function () {
    this.yyval = [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn160 = function () {

    var a = this.yyastk[ this.stackPos-(2-1) ],
    b = this.yyastk[ this.stackPos-(2-2) ];

    if (a & 7 && b & 7) {
        throw new Error('Multiple access type modifiers are not allowed');
    }

    if (a & this.MODIFIER_ABSTRACT && b & this.MODIFIER_ABSTRACT) {
        throw new Error('Multiple abstract modifiers are not allowed');
    }

    if (a & this.MODIFIER_STATIC && b & this.MODIFIER_STATIC) {
        throw new Error('Multiple static modifiers are not allowed');
    }

    if (a & this.MODIFIER_FINAL && b & this.MODIFIER_FINAL) {
        throw new Error('Multiple final modifiers are not allowed');
    }
/*
    if (a & 48 && b & 48) {
        throw new Error('Cannot use the final and abstract modifier at the same time');
    }
*/
    this.yyval =  a | b;
};

PHP.Parser.prototype.yyn161 = function () {
    this.yyval = this.MODIFIER_PUBLIC;
};

PHP.Parser.prototype.yyn162 = function () {
    this.yyval = this.MODIFIER_PROTECTED;
};

PHP.Parser.prototype.yyn163 = function () {
    this.yyval = this.MODIFIER_PRIVATE;
};

PHP.Parser.prototype.yyn164 = function () {
    this.yyval = this.MODIFIER_STATIC;
};

PHP.Parser.prototype.yyn165 = function () {
    this.yyval = this.MODIFIER_ABSTRACT;
};

PHP.Parser.prototype.yyn166 = function () {
    this.yyval = this.MODIFIER_FINAL;
};

PHP.Parser.prototype.yyn167 = function () {
    this.yyval = [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn168 = function () {
    this.yyastk[ this.stackPos-(3-1) ].push(this.yyastk[ this.stackPos-(3-3) ]);
    this.yyval = this.yyastk[ this.stackPos-(3-1) ];
};

PHP.Parser.prototype.yyn169 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        def: null,
        type: "Node_Stmt_PropertyProperty",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn170 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(3-1)].substring(1),
        def: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Stmt_PropertyProperty",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn171 = function () {
    if (!Array.isArray(this.yyastk[ this.stackPos-(3-1) ])) {
        this.yyastk[ this.stackPos-(3-1) ] = [ this.yyastk[ this.stackPos-(3-1) ] ];
    }

    this.yyastk[ this.stackPos-(3-1) ].push( this.yyastk[ this.stackPos-(3-3) ] );
    this.yyval =  this.yyastk[ this.stackPos-(3-1) ];
};

PHP.Parser.prototype.yyn172 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn173 = function () {
    this.yyval =  [];
};

PHP.Parser.prototype.yyn174 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn175 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn176 = function ( attributes ) {
    this.yyval =  {
        assignList: this.yyastk[this.stackPos-(6-3)],
        expr: this.yyastk[this.stackPos-(6-6)],
        type: "Node_Expr_AssignList",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn177 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Assign",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn178 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        refVar: this.yyastk[this.stackPos-(4-4)],
        type: "Node_Expr_AssignRef",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn179 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        refVar: this.yyastk[this.stackPos-(4-4)],
        type: "Node_Expr_Assign",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn180 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn181 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Clone",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn182 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignPlus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn183 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignMinus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn184 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignMul",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn185 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignDiv",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn186 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignConcat",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn187 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignMod",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn188 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignBitwiseAnd",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn189 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignBitwiseOr",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn190 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignBitwiseXor",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn191 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignShiftLeft",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn192 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        expr: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_AssignShiftRight",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn193 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(2-1)],
        type: "Node_Expr_PostInc",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn194 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_PreInc",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn195 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(2-1)],
        type: "Node_Expr_PostDec",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn196 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_PreDec",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn197 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_BooleanOr",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn198 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_BooleanAnd",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn199 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_LogicalOr",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn200 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_LogicalAnd",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn201 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_LogicalXor",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn202 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_BitwiseOr",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn203 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_BitwiseAnd",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn204 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_BitwiseXor",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn205 = function ( attributes ) {
    // todo add parse escape sequence
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Concat",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn206 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Plus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn207 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Minus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn208 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Mul",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn209 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Div",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn210 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Mod",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn211 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_ShiftLeft",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn212 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_ShiftRight",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn213 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_UnaryPlus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn214 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_UnaryMinus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn215 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_BooleanNot",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn216 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_BitwiseNot",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn217 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Identical",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn218 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_NotIdentical",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn219 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Equal",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn220 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_NotEqual",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn221 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Smaller",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn222 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_SmallerOrEqual",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn223 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Greater",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn224 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_GreaterOrEqual",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn225 = function ( attributes ) {
    this.yyval =  {
        left: this.yyastk[this.stackPos-(3-1)],
        right: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_Instanceof",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn226 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn227 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn228 = function ( attributes ) {
    this.yyval =  {
        cond: this.yyastk[this.stackPos-(5-1)],
        If: this.yyastk[this.stackPos-(5-3)],
        Else: this.yyastk[this.stackPos-(5-5)],
        type: "Node_Expr_Ternary",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn229 = function ( attributes ) {
    this.yyval =  {
        cond: this.yyastk[this.stackPos-(4-1)],
        If: null,
        Else: this.yyastk[this.stackPos-(4-4)],
        type: "Node_Expr_Ternary",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn230 = function ( attributes ) {
    this.yyval =  {
        variables: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Isset",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn231 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Empty",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn232 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Include",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn233 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_IncludeOnce",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn234 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Eval",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn235 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Require",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn236 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_RequireOnce",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn237 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Int",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn238 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Double",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn239 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_String",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn240 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Array",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn241 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Object",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn242 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Bool",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn243 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Cast_Unset",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn244 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Exit",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn245 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_ErrorSuppress",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn246 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn247 = function ( attributes ) {
    this.yyval =  {
        items: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Array",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn248 = function ( attributes ) {
    this.yyval =  {
        items: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Expr_Array",
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn249 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Expr_ShellExec",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn250 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Print",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn251 = function ( attributes ) {
    this.yyval =  {
        Static: false,
        byRef: this.yyastk[this.stackPos-(9-2)],
        params: this.yyastk[this.stackPos-(9-4)],
        uses: this.yyastk[this.stackPos-(9-6)],
        stmts: this.yyastk[this.stackPos-(9-8)],
        type: "Node_Expr_Closure",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn252 = function ( attributes ) {
    this.yyval =  {
        Static: true,
        byRef: this.yyastk[this.stackPos-(10-3)],
        params: this.yyastk[this.stackPos-(10-5)],
        uses: this.yyastk[this.stackPos-(10-7)],
        stmts: this.yyastk[this.stackPos-(10-9)],
        type: "Node_Expr_Closure",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn253 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(3-2)],
        args: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_New",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn254 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn255 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(4-3) ];
};

PHP.Parser.prototype.yyn256 = function () {
    this.yyval =  [ this.yyastk[ this.stackPos-(1-1) ] ];
};

PHP.Parser.prototype.yyn257 = function () {
    this.yyastk[this.stackPos-(3-1)].push(this.yyastk[this.stackPos-(3-3)]);
    this.yyval = this.yyastk[this.stackPos-(3-1)];
};

PHP.Parser.prototype.yyn258 = function ( attributes ) {
    this.yyval =  {
        byRef: this.yyastk[this.stackPos-(2-1)],
        variable: this.yyastk[this.stackPos-(2-2)].substring(1),
        type: "Node_Expr_ClosureUse",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn259 = function ( attributes ) {
    this.yyval =  {
        func: this.yyastk[this.stackPos-(4-1)],
        args: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_FuncCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn260 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(6-1)],
        func: this.yyastk[this.stackPos-(6-3)],
        args: this.yyastk[this.stackPos-(6-5)],
        type: "Node_Expr_StaticCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn261 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(8-1)],
        func: this.yyastk[this.stackPos-(8-4)],
        args: this.yyastk[this.stackPos-(8-7)],
        type: "Node_Expr_StaticCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn262 = function ( attributes ) {
    var tmp;

    // TODO verify its correct

    if ( this.yyastk[this.stackPos-(4-1)].type === "Node_Expr_StaticPropertyFetch" ) {

        this.yyval = {
            Class: this.yyastk[this.stackPos-(4-1)].Class,
            func:   {
                name: this.yyastk[this.stackPos-(4-1)].name,
                type: "Node_Expr_Variable",
                attributes: attributes
            },
            args: this.yyastk[this.stackPos-(4-3)],
            type: "Node_Expr_StaticCall",
            attributes: attributes
        };
    } else if (this.yyastk[this.stackPos-(4-1)].type  === "Node_Expr_ArrayDimFetch") {
        tmp = this.yyastk[this.stackPos-(4-1)];
        while (tmp.variable.type === "Node_Expr_ArrayDimFetch") {
            tmp = tmp.variable;
        }

        this.yyval = {
            Class: tmp.variable.Class,
            func:   this.yyastk[this.stackPos-(4-1)],
            args: this.yyastk[this.stackPos-(4-3)],
            type: "Node_Expr_StaticCall",
            attributes: attributes
        };

        tmp.variable = {
            name: tmp.variable.name,
            type: "Node_Expr_Variable",
            attributes: attributes
        };

    } else {
        throw new Exception;
    }
};

PHP.Parser.prototype.yyn263 = function ( attributes ) {
    this.yyval =  {
        func: this.yyastk[this.stackPos-(4-1)],
        args: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_FuncCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn264 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn265 = function ( attributes ) {
    this.yyval =  {
        parts: "static",
        type: "Node_Name",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn266 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn267 = function ( attributes ) {
    this.yyval =  {
        parts: this.yyastk[this.stackPos-(1-1)],
        type: "Node_Name",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn268 = function ( attributes ) {
    this.yyval =  {
        parts: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Name_FullyQualified",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn269 = function ( attributes ) {
    this.yyval =  {
        parts: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Name_Relative",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn270 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn271 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn272 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn273 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn274 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn275 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn276 = function () {
    this.yyval =  this.yyastk[ this.stackPos ];
};

PHP.Parser.prototype.yyn277 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_PropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn278 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_PropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn279 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn280 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn281 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn282 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn283 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn284 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn285 = function ( attributes ) {
    // todo add parse escape sequence
    this.yyval =  {
        type: "Node_Scalar_String",
        value: this.yyastk[this.stackPos-(1-1)],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn286 = function ( attributes ) {

    this.yyastk[this.stackPos-(1-1)].forEach(function( s ){
        if (typeof s === "string") {
    // todo add parse escape sequense
    }

    });
    /*
    foreach ($this->yyastk[$this->stackPos-(1-1)] as &$s) {
        if (is_string($s)) {
            $s = PHPParser_Node_Scalar_String::parseEscapeSequences($s, '`');
        }
    };
    */
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn287 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn288 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(3-2) ];
};

PHP.Parser.prototype.yyn289 = function ( attributes ) {
    // todo add parse sequence
    this.yyval =  {
        type: "Node_Scalar_LNumber",
        value: this.yyastk[this.stackPos-(1-1)],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn290 = function ( attributes ) {
    // todo add parse sequence
    this.yyval =  {
        type: "Node_Scalar_DNumber",
        value: this.yyastk[this.stackPos-(1-1)],
        attributes: attributes
    };
};


// string
PHP.Parser.prototype.yyn291 = function ( attributes ) {
    // todo add parse escape sequence
    this.yyval =  {
        type: "Node_Scalar_String",
        value: this.parseString( this.yyastk[this.stackPos-(1-1)] ),
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn292 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_LineConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn293 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_FileConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn294 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_DirConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn295 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_ClassConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn296 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_TraitConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn297 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_MethodConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn298 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_FuncConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn299 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_NSConst",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn300 = function ( attributes ) {
    // todo add parse DOC escape sequence
    this.yyval =  {
        type: "Node_Scalar_String",
        value: this.yyastk[this.stackPos-(3-2)],
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn301 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Scalar_String",
        value: '',
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn302 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Expr_ConstFetch",
        name: this.yyastk[this.stackPos-(1-1)],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn303 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn304 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Expr_ClassConstFetch",
        Class: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn305 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_UnaryPlus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn306 = function ( attributes ) {
    this.yyval =  {
        expr: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_UnaryMinus",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn307 = function ( attributes ) {
    this.yyval =  {
        items: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Array",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn308 = function ( attributes ) {
    this.yyval =  {
        items: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Expr_Array",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn309 = function () {
    this.yyval =  this.yyastk[ this.stackPos-(1-1) ];
};

PHP.Parser.prototype.yyn310 = function ( attributes ) {
    this.yyval =  {
        type: "Node_Expr_ClassConstFetch",
        Class: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn311 = function ( attributes ) {

    this.yyastk[this.stackPos-(3-2)].forEach(function( s ){
        if (typeof s === "string") {
    // todo add parse escape sequense
    }
    /* foreach ($this->yyastk[$this->stackPos-(3-2)] as &$s) {
        if (is_string($s)) {
            $s = PHPParser_Node_Scalar_String::parseEscapeSequences($s, null);
        }
    }


    $this->yyval = new PHPParser_Node_Scalar_Encapsed($this->yyastk[$this->stackPos-(3-2)], $attributes);

        */
    });
    this.yyval =  {
        parts: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Scalar_Encapsed",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn312 = function ( attributes ) {

    this.yyastk[this.stackPos-(3-2)].forEach(function( s ){
        if (typeof s === "string") {
    // todo add parse escape sequense
    }
    /* foreach ($this->yyastk[$this->stackPos-(3-2)] as &$s) {
        if (is_string($s)) {
            $s = PHPParser_Node_Scalar_String::parseEscapeSequences($s, null);
        }
    }
    $s = preg_replace('~(\r\n|\n|\r)$~', '', $s);
    if ('' === $s) array_pop($this->yyastk[$this->stackPos-(3-2)]);;

    $this->yyval = new PHPParser_Node_Scalar_Encapsed($this->yyastk[$this->stackPos-(3-2)], $attributes);

        */
    });
    this.yyval =  {
        parts: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Scalar_Encapsed",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn313 = function () {
    this.yyval = [];
};

PHP.Parser.prototype.yyn314 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn315 = function () {
    this.yyval = this.yyastk[ this.stackPos ];
};

PHP.Parser.prototype.yyn316 = function () {
    this.yyval = this.yyastk[ this.stackPos ];
};

PHP.Parser.prototype.yyn317 = function () {


    if (!Array.isArray(this.yyastk[ this.stackPos-(3-1) ])) {
        this.yyastk[ this.stackPos-(3-1) ] = [ this.yyastk[ this.stackPos-(3-1) ] ];
    }


    this.yyastk[ this.stackPos-(3-1) ].push( this.yyastk[this.stackPos-(3-3)] );
    this.yyval = this.yyastk[this.stackPos-(3-1)];
};

PHP.Parser.prototype.yyn318 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn319 = function ( attributes ) {
    this.yyval =  {
        byRef: false,
        value: this.yyastk[this.stackPos-(3-3)],
        key: this.yyastk[this.stackPos-(3-1)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn320 = function ( attributes ) {
    this.yyval =  {
        byRef: false,
        value: this.yyastk[this.stackPos-(1-1)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn321 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn322 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn323 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn324 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn325 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(6-2)],
        dim: this.yyastk[this.stackPos-(6-5)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn326 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn327 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_PropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn328 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(6-1)],
        name: this.yyastk[this.stackPos-(6-3)],
        args: this.yyastk[this.stackPos-(6-5)],
        type: "Node_Expr_MethodCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn329 = function ( attributes ) {
    this.yyval =  {
        func: this.yyastk[this.stackPos-(4-1)],
        args: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_FuncCall",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn330 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn331 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn332 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn333 = function () {
    this.yyval = this.yyastk[this.stackPos-(3-2)];
};

PHP.Parser.prototype.yyn334 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn335 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn336 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn337 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn338 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(4-1)],
        name: this.yyastk[this.stackPos-(4-4)],
        type: "Node_Expr_StaticPropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn339 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn340 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(3-1)],
        name: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_StaticPropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn341 = function ( attributes ) {
    this.yyval =  {
        Class: this.yyastk[this.stackPos-(6-1)],
        name: this.yyastk[this.stackPos-(6-5)],
        type: "Node_Expr_StaticPropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn342 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn343 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn344 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn345 = function ( attributes ) {
    this.yyval =  {
        variable: this.yyastk[this.stackPos-(4-1)],
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};


PHP.Parser.prototype.yyn346 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn347 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn348 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn349 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn350 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn351 = function () {
    this.yyval = this.yyastk[this.stackPos-(3-2)];
};

PHP.Parser.prototype.yyn352 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn353 = function () {
    this.yyastk[this.stackPos-(3-1)].push(this.yyastk[this.stackPos-(3-3)]);
    this.yyval = this.yyastk[this.stackPos-(3-1)];

};

PHP.Parser.prototype.yyn354 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn355 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn356 = function () {
    this.yyval = this.yyastk[this.stackPos-(4-3)];
};

PHP.Parser.prototype.yyn357 = function () {
    this.yyval = null;
};

PHP.Parser.prototype.yyn358 = function () {
    this.yyval = {};
};

PHP.Parser.prototype.yyn359 = function () {
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn360 = function () {

    if (!Array.isArray(this.yyastk[this.stackPos-(3-1)])) {
        this.yyastk[this.stackPos-(3-1)] = [this.yyastk[this.stackPos-(3-1)]];
    }

    this.yyastk[this.stackPos-(3-1)].push(this.yyastk[this.stackPos-(3-3)]);

    this.yyval = this.yyastk[this.stackPos-(3-1)];


};

PHP.Parser.prototype.yyn361 = function () {
    this.yyval = this.yyastk[this.stackPos-(1-1)];
};

PHP.Parser.prototype.yyn362 = function ( attributes ) {
    this.yyval =  {
        byRef: false,
        value: this.yyastk[this.stackPos-(3-3)],
        key: this.yyastk[this.stackPos-(3-1)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn363 = function ( attributes ) {
    this.yyval =  {
        byRef: false,
        value: this.yyastk[this.stackPos-(1-1)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn364 = function ( attributes ) {
    this.yyval =  {
        byRef: true,
        value: this.yyastk[this.stackPos-(4-4)],
        key: this.yyastk[this.stackPos-(4-1)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn365 = function ( attributes ) {
    this.yyval =  {
        byRef: true,
        value: this.yyastk[this.stackPos-(2-2)],
        type: "Node_Expr_ArrayItem",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn366 = function () {
    this.yyastk[this.stackPos-(2-1)].push(this.yyastk[this.stackPos-(2-2)]);
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn367 = function () {
    this.yyastk[this.stackPos-(2-1)].push(this.yyastk[this.stackPos-(2-2)]);
    this.yyval = this.yyastk[this.stackPos-(2-1)];
};

PHP.Parser.prototype.yyn368 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(1-1)] ];
};

PHP.Parser.prototype.yyn369 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(2-1)], this.yyastk[this.stackPos-(2-2)] ];
};

PHP.Parser.prototype.yyn370 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn371 = function ( attributes ) {
    this.yyval =  {
        variable: {
            name: this.yyastk[this.stackPos-(4-1)].substring(1),
            type: "Node_Expr_Variable",
            attributes: attributes
        },
        dim: this.yyastk[this.stackPos-(4-3)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn372 = function ( attributes ) {
    this.yyval =  {
        Class: {
            name: this.yyastk[this.stackPos-(3-1)].substring(1),
            type: "Node_Expr_Variable",
            attributes: attributes
        },
        name: this.yyastk[this.stackPos-(3-3)],
        type: "Node_Expr_StaticPropertyFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn373 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn374 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(3-2)],
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn375 = function ( attributes ) {
    this.yyval =  {
        variable: {
            name: this.yyastk[this.stackPos-(6-2)],
            type: "Node_Expr_Variable",
            attributes: attributes
        },
        dim: this.yyastk[this.stackPos-(6-4)],
        type: "Node_Expr_ArrayDimFetch",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn376 = function () {
    this.yyval = [ this.yyastk[this.stackPos-(3-2)] ];
};

PHP.Parser.prototype.yyn377 = function ( attributes ) {
    this.yyval =  {
        value: this.yyastk[this.stackPos-(1-1)],
        type: "Node_Scalar_String",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn378 = function ( attributes ) {
    this.yyval =  {
        value: this.yyastk[this.stackPos-(1-1)],
        type: "Node_Scalar_String",
        attributes: attributes
    };
};

PHP.Parser.prototype.yyn379 = function ( attributes ) {
    this.yyval =  {
        name: this.yyastk[this.stackPos-(1-1)].substring(1),
        type: "Node_Expr_Variable",
        attributes: attributes
    };
};
PHP.VM = function( src, opts ) {
    
    var $ = PHP.VM.VariableHandler( this );
    // console.log($('_POST'));
  
    var $$ = function( arg ) {
        
        
        return new PHP.VM.Variable( arg );
    },
    ENV = this;
    PHP.VM.Variable.prototype.ENV = ENV;
    
    ENV [ PHP.Compiler.prototype.FILESYSTEM ] = (opts.filesystem === undefined ) ? {} : opts.filesystem;
    
    // bind global variablehandler to ENV
    ENV[ PHP.Compiler.prototype.GLOBAL ] = $;
 
    ENV[ PHP.Compiler.prototype.CONSTANTS ] = PHP.VM.Constants( PHP.Constants, ENV );
    
    ENV.$Class = (function() {
        var classRegistry = {},
        COMPILER = PHP.Compiler.prototype,
        VARIABLE = PHP.VM.Variable.prototype,
        magicConstants = {},
        initiatedClasses = [],
        undefinedConstants = {},
        classHandler = new PHP.VM.Class( ENV, classRegistry, magicConstants, initiatedClasses, undefinedConstants );
        
        ENV[ COMPILER.MAGIC_CONSTANTS ] = function( constantName ) {
            return new PHP.VM.Variable( magicConstants[ constantName ] );
        };
        
        var methods =  {
            INew: function( name, exts, func ) {
                return classHandler( name, PHP.VM.Class.INTERFACE, exts, func );
            },
            New: function() {
                return classHandler.apply( null, arguments );
            },
            ConstantGet: function( className, state, constantName ) {
                
                if ( !/(self|parent)/i.test( className ) && classRegistry[ className.toLowerCase() ] === undefined ) {
                    if ( undefinedConstants[ className + "::" + constantName] === undefined ) {
                        var variable = new PHP.VM.Variable();
                        variable[ VARIABLE.CLASS_CONSTANT ] = true;
                        variable[ VARIABLE.DEFINED ] = className + "::$" + constantName;
                        undefinedConstants[ className + "::" + constantName] = variable;
                    
                    }
                
                    return undefinedConstants[ className + "::" + constantName];
                    
                } else {
                    return methods.Get(  className, state )[ COMPILER.CLASS_CONSTANT_FETCH ]( state, constantName );
                    
                }
                
            },
            Get: function( className, state ) {
               
                if ( !/(self|parent)/i.test( className ) ) {
                    if (state !== undefined) {
                        return classRegistry[ className.toLowerCase() ].prototype;
                    } else {
                        return classRegistry[ className.toLowerCase() ];
                    }
                } else if ( /self/i.test( className ) ) {
                    return state.prototype;
                //      return Object.getPrototypeOf( state );  
                } else if ( /parent/i.test( className ) ) {
                    return Object.getPrototypeOf( state.prototype  ); 
                 //   return Object.getPrototypeOf( Object.getPrototypeOf( state ) );  
                }
                
                
                
            }
        };
        
        return methods;
    })();
    
    ENV[ PHP.Compiler.prototype.RESOURCES ] = PHP.VM.ResourceManager( ENV ); 
    
    ENV.$Array = new PHP.VM.Array( ENV );
    
    $('_POST').$ = PHP.VM.Array.fromObject.call( this, opts.POST ).$;
    $('_GET').$ = PHP.VM.Array.fromObject.call( this, opts.GET ).$;

    $('_SERVER').$ = PHP.VM.Array.fromObject.call( this, opts.SERVER ).$;
    
    
    Object.keys( PHP.VM.Class.Predefined ).forEach(function( className ){
        PHP.VM.Class.Predefined[ className]( ENV );
    });
    /*
    var exec = new Function( "$$", "$", "ENV", src  );
        exec.call(this, $$, $, ENV);

       */
    try {
        var exec = new Function( "$$", "$", "ENV", src  );
        exec.call(this, $$, $, ENV);
    } catch( e ) {
        console.log("Caught: ", e.message, e);
        console.log("Buffer: ", this.OUTPUT_BUFFER);
    }
          

   
};

PHP.VM.prototype = new PHP.Modules();

/* 
 * @author Niklas von Hertzen <niklas at hertzen.com>
 * @created 26.6.2012 
 * @website http://hertzen.com
 */


PHP.VM.Class = function( ENV, classRegistry, magicConstants, initiatedClasses, undefinedConstants ) {
    
    var methodPrefix = PHP.VM.Class.METHOD,
    methodArgumentPrefix = "_$_",
    propertyPrefix = PHP.VM.Class.PROPERTY,
    methodTypePrefix = "$£",
    propertyTypePrefix = "$£$",
    COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype,
    __call = "__call",
    __set = "__set",
    __get = "__get",
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
    STATIC = "STATIC",
    ABSTRACT = "ABSTRACT",
    FINAL = "FINAL",
    INTERFACE = "INTERFACE",
    PROTECTED = "PROTECTED",
    __destruct = "__destruct",
    __construct = "__construct";
    
    
    // helper function for checking whether variable/method is of type
    function checkType( value, type) {
        if ( type === PUBLIC) {
            return ((value & PHP.VM.Class[ type ]) === PHP.VM.Class[ type ]) || (value  === PHP.VM.Class[ STATIC ]);
        } else {
            return ((value & PHP.VM.Class[ type ]) === PHP.VM.Class[ type ]);
        }
        
    }
    
    var buildVariableContext = function( methodName, args, className ) {
        
        var $ = PHP.VM.VariableHandler(),
        argumentObj = this[ methodArgumentPrefix + methodName ];
        
        if ( Array.isArray(argumentObj) ) {
            argumentObj.forEach( function( arg, index ) {
                // assign arguments to correct variable names
                if ( args[ index ] !== undefined ) {
                    if ( args[ index ] instanceof PHP.VM.VariableProto) {
                        $( arg.name )[ COMPILER.VARIABLE_VALUE ] = args[ index ][ COMPILER.VARIABLE_VALUE ];
                    } else {
                        $( arg.name )[ COMPILER.VARIABLE_VALUE ] = args[ index ];
                    }
                } else {
                    // no argument passed for the specified index
                    $( arg.name )[ COMPILER.VARIABLE_VALUE ] = (new PHP.VM.Variable())[ COMPILER.VARIABLE_VALUE ];
                }
                

            });
        }
        
        $("$__METHOD__")[ COMPILER.VARIABLE_VALUE ] = className + "::" + methodName;
        
        return $;
    }
    
    
    
    return function() {
       
        var className = arguments[ 0 ], 
        classType = arguments[ 1 ], 
        opts = arguments[ 2 ],
        classDefinition = arguments[ 3 ],
        DECLARED = false,
        props = {},
        
        callMethod = function( methodName, args ) {

            
            var $ = buildVariableContext.call( this, methodName, args, this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] );
           
            console.log('calling ', methodName, this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ], args);
            //magicConstants.METHOD = this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName;
            
            return this[ methodPrefix + methodName ].call( this, $, this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] );
        };
   
        var Class = function( ctx ) {
         
            Object.keys( props ).forEach(function( propertyName ){
                
                if ( checkType(this[propertyTypePrefix + propertyName], STATIC)) {
                // static, so refer to the one and only same value defined in actual prototype

                //  this[ propertyPrefix + propertyName ] = this[ propertyPrefix + propertyName ];
                    
                } else {
                    if ( Array.isArray( props[ propertyName ] ) ) {
                        this[ propertyPrefix + propertyName ] = new PHP.VM.Variable( [] );
                    } else {
                        this[ propertyPrefix + propertyName ] = new PHP.VM.Variable( props[ propertyName ] );
                    }
                }
                
                this [ PHP.VM.Class.CLASS_PROPERTY + className + "_" + propertyPrefix + propertyName] = this[ propertyPrefix + propertyName ];
            }, this);
            
            // call constructor
            
            if ( ctx !== true ) {
                // check if we are extending class, i.e. don't call constructors
                 
                 
                 
                 
                // make sure we aren't initiating an abstract class 
                if (checkType( this[ COMPILER.CLASS_TYPE ], ABSTRACT ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot instantiate abstract class " + className, PHP.Constants.E_ERROR, true ); 
                }

                // make sure we aren't initiating an interface 
                if (checkType( this[ COMPILER.CLASS_TYPE ], INTERFACE ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot instantiate interface " + className, PHP.Constants.E_ERROR, true ); 
                }
                 
                // register new class initiated into registry (for destructors at shutdown) 
                initiatedClasses.push ( this ); 
                 
                // PHP 5 style constructor in current class
                
                if ( Object.getPrototypeOf( this ).hasOwnProperty(  methodPrefix + __construct  ) ) {
                    return callMethod.call( this, __construct, Array.prototype.slice.call( arguments, 1 ) );         
                }
                
                // PHP 4 style constructor in current class
                
                else if ( Object.getPrototypeOf( this ).hasOwnProperty(  methodPrefix + className  ) ) {
                    return callMethod.call( this, className, Array.prototype.slice.call( arguments, 1 ) );         
                }
                
                // PHP 5 style constructor in any inherited class
                
                else if ( typeof this[ methodPrefix + __construct ] === "function" ) {
                    return callMethod.call( this, __construct, Array.prototype.slice.call( arguments, 1 ) );         
                }
                
                // PHP 4 style constructor in any inherited class
                
                else {
                    var proto = this;
                    
                    while ( ( proto = Object.getPrototypeOf( proto ) ) instanceof PHP.VM.ClassPrototype ) {
                        
                        if ( proto.hasOwnProperty( methodPrefix + proto[ COMPILER.CLASS_NAME  ] ) ) {
                           
                            return callMethod.call( proto, proto[ COMPILER.CLASS_NAME  ], Array.prototype.slice.call( arguments, 1 ) ); 
                        }
                            
                            
                    }
                        
                }
            }
           
     

        }, 
        methods = {};
        
        /*
         * Declare class constant
         */ 
        methods [ COMPILER.CLASS_CONSTANT ] = function( constantName, constantValue ) {
            
            if ( Class.prototype[ PHP.VM.Class.CONSTANT + constantName ] !== undefined ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot redefine class constant " + className + "::" + constantName, PHP.Constants.E_ERROR, true );    
            }
            
            
            if ( undefinedConstants[ className + "::" + constantName] !== undefined ) {
                
                Class.prototype[ PHP.VM.Class.CONSTANT + constantName ] = undefinedConstants[ className + "::" + constantName];
                
                if ( constantValue[ VARIABLE.CLASS_CONSTANT ] ) {
                    // class constant referring another class constant, use reference
                    undefinedConstants[ className + "::" + constantName][ VARIABLE.REFERRING ] = constantValue;
                } else {
                    Class.prototype[ PHP.VM.Class.CONSTANT + constantName ][ COMPILER.VARIABLE_VALUE ] = constantValue[ COMPILER.VARIABLE_VALUE ];
                }
                
                
            } else {
                constantValue[ VARIABLE.CLASS_CONSTANT ] = true;
                Class.prototype[ PHP.VM.Class.CONSTANT + constantName ] = constantValue;
            }
            
            if (Class.prototype[ PHP.VM.Class.CONSTANT + constantName ][ VARIABLE.TYPE ] === VARIABLE.ARRAY ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Arrays are not allowed in class constants", PHP.Constants.E_ERROR, true );  
            }
            
            return methods;
        };
        
        /*
         * Declare class property
         */       
        
        methods [ COMPILER.CLASS_PROPERTY ] = function( propertyName, propertyType, propertyDefault ) {
            props[ propertyName ] = propertyDefault;
            
            // can't define members for interface
            if ( classType === PHP.VM.Class.INTERFACE ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Interfaces may not include member variables", PHP.Constants.E_ERROR, true ); 
            }
            
            if ( Class.prototype[ propertyTypePrefix + propertyName ] !== undefined &&  Class.prototype[ propertyTypePrefix + propertyName ] !== propertyType ) {
                // property has been defined in an inherited class and isn't of same type as newly defined one, 
                // so let's make sure it is weaker or throw an error
                
                var type = Class.prototype[ propertyTypePrefix + propertyName ],
                inheritClass = Object.getPrototypeOf( Class.prototype )[ COMPILER.CLASS_NAME ];
                
                // redeclaring a (non-private) static as non-static
                if (!checkType( propertyType, STATIC ) && checkType( type, STATIC ) && !checkType( type, PRIVATE ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot redeclare static " + inheritClass + "::$" + propertyName + " as non static " + className + "::$" + propertyName, PHP.Constants.E_ERROR, true ); 
                }
                
                // redeclaring a (non-private) non-static as static
                if (checkType( propertyType, STATIC ) && !checkType( type, STATIC ) && !checkType( type, PRIVATE ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot redeclare non static " + inheritClass + "::$" + propertyName + " as static " + className + "::$" + propertyName, PHP.Constants.E_ERROR, true ); 
                }
                
                if (!checkType( propertyType, PUBLIC ) ) {
                    
                    if ( ( checkType( propertyType, PRIVATE ) || checkType( propertyType, PROTECTED ) ) && checkType( type, PUBLIC )  ) {
                        ENV[ PHP.Compiler.prototype.ERROR ]( "Access level to " + className + "::$" + propertyName + " must be public (as in class " + inheritClass + ")", PHP.Constants.E_ERROR, true );
                    }
                    
                    if ( ( checkType( propertyType, PRIVATE )  ) && checkType( type, PROTECTED )  ) {
                        ENV[ PHP.Compiler.prototype.ERROR ]( "Access level to " + className + "::$" + propertyName + " must be protected (as in class " + inheritClass + ") or weaker", PHP.Constants.E_ERROR, true );
                    }
                    
                }

                
            }
            
           
            
            if ( checkType( propertyType, STATIC )) {
                Object.defineProperty( Class.prototype,  propertyPrefix + propertyName, {
                    value: propertyDefault
                });
            } 
            
            
            
            
            Object.defineProperty( Class.prototype, propertyTypePrefix + propertyName, {
                value: propertyType
            });
             
            return methods;
        };

        /*
         * Declare method
         */

        methods [ COMPILER.CLASS_METHOD ] = function( methodName, methodType, methodProps, methodFunc ) {
            
            /*
             * signature checks
             */
            
                        
            // can't override final 
            if ( Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined && checkType( Class.prototype[ methodTypePrefix + methodName ], FINAL ) ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot override final method " + Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName + "()", PHP.Constants.E_ERROR, true );
            }
            
            // can't make static non-static
            if ( Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined && checkType( Class.prototype[ methodTypePrefix + methodName ], STATIC ) && !checkType( methodType, STATIC ) ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot make static method " + Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName + "() non static in class " + className, PHP.Constants.E_ERROR, true );
            }
            
            // can't make non-static  static
            if ( Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined && !checkType( Class.prototype[ methodTypePrefix + methodName ], STATIC ) && checkType( methodType, STATIC ) ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot make non static method " + Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName + "() static in class " + className, PHP.Constants.E_ERROR, true );
            }
 
            // A final method cannot be abstract
            if ( checkType( methodType, ABSTRACT ) && checkType( methodType, FINAL ) ) {
                ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot use the final modifier on an abstract class member", PHP.Constants.E_ERROR, true );
            }
           
            
                // visibility from public
                if ( Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined && checkType( Class.prototype[ methodTypePrefix + methodName ], PUBLIC ) && (checkType( methodType, PROTECTED ) || checkType( methodType, PRIVATE ) ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Access level to " + className + "::" + methodName + "() must be public (as in class same)", PHP.Constants.E_ERROR, true );
                } 
                // visibility from protected
                if ( Class.prototype[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined && checkType( Class.prototype[ methodTypePrefix + methodName ], PROTECTED ) && checkType( methodType, PRIVATE ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Access level to " + className + "::" + methodName + "() must be protected (as in class same) or weaker", PHP.Constants.E_ERROR, true );
                }
           
            
            // __call
            if ( methodName === __call  ) { 
                
                if ( methodProps.length !== 2 ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Method " + className + "::" + methodName + "() must take exactly 2 arguments", PHP.Constants.E_ERROR, true );
                }
                
                if ( !checkType( methodType, PUBLIC ) || checkType( methodType, STATIC ) ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "The magic method " + methodName + "() must have public visibility and cannot be static", PHP.Constants.E_CORE_WARNING, true );
                }
                
            }
            
            // __get
            
            else if ( methodName === __get  ) { 
                if ( methodProps.length !== 1 ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Method " + className + "::" + methodName + "() must take exactly 1 argument", PHP.Constants.E_ERROR, true );
                }
            }
            
            // __set
            
            else if ( methodName === __set  ) { 
                if ( methodProps.length !== 2 ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Method " + className + "::" + methodName + "() must take exactly 2 arguments", PHP.Constants.E_ERROR, true );
                }
            }
            
            // end signature checks
            
            Object.defineProperty( Class.prototype, PHP.VM.Class.METHOD_PROTOTYPE + methodName, {
                value: Class.prototype
            });
            
            Object.defineProperty( Class.prototype, methodTypePrefix + methodName, {
                value: methodType 
            });
            
            Object.defineProperty( Class.prototype, methodPrefix + methodName, {
                value: methodFunc,
                enumerable: true
            });
            
            Object.defineProperty( Class.prototype, methodArgumentPrefix + methodName, {
                value: methodProps 
            });
            
            return methods;
        };
            
        methods [ COMPILER.CLASS_DECLARE ] = function() {
            
            if ( !checkType( classType, ABSTRACT ) ) {
                // make sure there are no abstract methods left undeclared
                
                
                Object.keys( Class.prototype ).forEach(function( item ){
                    if ( item.substring( 0, methodPrefix.length ) === methodPrefix ) {
                        
                        var methodName = item.substring( methodPrefix.length );
                        if ( checkType( Class.prototype[ methodTypePrefix + methodName ], ABSTRACT ) ) {
                            ENV[ PHP.Compiler.prototype.ERROR ]( "Class " + className + " contains 1 abstract method and must therefore be declared abstract or implement the remaining methods (" + className + "::" + methodName + ")", PHP.Constants.E_ERROR, true );
                        }
                     
                    }
                });
                
                // interfaces
                Class.prototype[ PHP.VM.Class.INTERFACES ].forEach( function( interfaceName ){
                    
                    var interfaceProto = classRegistry[ interfaceName.toLowerCase() ].prototype;
                    Object.keys( interfaceProto ).forEach(function( item ){
                        if ( item.substring( 0, methodPrefix.length ) === methodPrefix ) {
                        
                            var methodName = item.substring( methodPrefix.length );
                            if (Class.prototype[ methodTypePrefix + methodName ] === undefined ) {
                                ENV[ PHP.Compiler.prototype.ERROR ]( "Class " + className + " contains 1 abstract method and must therefore be declared abstract or implement the remaining methods (" + interfaceName + "::" + methodName + ")", PHP.Constants.E_ERROR, true );
                            }
                        }
                    });
                    
                });

                
            }
            
            
            DECLARED = true;
            
            return Class;
        };
        
        
        /*
         * Extends and implements
         */
        
        if (opts.Extends  !== undefined) {
            
            var Extends = classRegistry[ opts.Extends.toLowerCase() ];
            
            if ( Extends.prototype[ COMPILER.CLASS_TYPE ] === PHP.VM.Class.INTERFACE ) {
                // can't extend interface
                ENV[ PHP.Compiler.prototype.ERROR ]( "Class " + className + " cannot extend from interface " + opts.Extends, PHP.Constants.E_ERROR, true );
              
            } else if ( checkType(Extends.prototype[ COMPILER.CLASS_TYPE ], FINAL ) ) {
                // can't extend final class
                ENV[ PHP.Compiler.prototype.ERROR ]( "Class " + className + " may not inherit from final class (" + opts.Extends + ")", PHP.Constants.E_ERROR, true );
              
            }
            
            Class.prototype = new Extends( true );
        } else {
            Class.prototype = new PHP.VM.ClassPrototype();
            Class.prototype[ PHP.VM.Class.INTERFACES ] = [];
        }
        
        if (opts.Implements !== undefined ) {

            opts.Implements.forEach(function( interfaceName ){
                var Implements = classRegistry[ interfaceName.toLowerCase() ];
                
                if ( Implements.prototype[ COMPILER.CLASS_TYPE ] !== PHP.VM.Class.INTERFACE ) {
                    // can't implement non-interface
                    ENV[ PHP.Compiler.prototype.ERROR ]( className + " cannot implement " + interfaceName + " - it is not an interface", PHP.Constants.E_ERROR, true );
                }
                
                if ( Class.prototype[ PHP.VM.Class.INTERFACES ].indexOf( interfaceName) === -1 ) {
                    // only add interface if it isn't present already
                    Class.prototype[ PHP.VM.Class.INTERFACES ].push( interfaceName );
                }
                
            });
        }

        
        Class.prototype[ COMPILER.CLASS_TYPE ] = classType;
        
        Class.prototype[ COMPILER.CLASS_NAME ] = className;
        
        Class.prototype[ COMPILER.METHOD_CALL ] = function( ctx, methodName ) {
             
            var args = Array.prototype.slice.call( arguments, 2 );

            if ( typeof this[ methodPrefix + methodName ] !== "function" ) {
                // no method with that name found
                  
                if ( typeof this[ methodPrefix + __call ] === "function" ) {
                    // __call method defined, let's call that instead then
                    
                    
                    // determine which __call to use in case there are several defined
                    if ( ctx instanceof PHP.VM ) {
                        // normal call, use current context
                        return callMethod.call( this, __call, [ new PHP.VM.Variable( methodName ), new PHP.VM.Variable( PHP.VM.Array.fromObject.call( ENV, args ) ) ] );
                    } else {
                        // static call, ensure current scope's __call() is favoured over the specified class's  __call()
                        return ctx.callMethod.call( ctx, __call, [ new PHP.VM.Variable( methodName ), new PHP.VM.Variable( PHP.VM.Array.fromObject.call( ENV, args ) ) ] );
                    }
               
                }
                  
            } else {
               
                if ( checkType( this[ methodTypePrefix + methodName ], PRIVATE ) && this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] !== ctx[ COMPILER.CLASS_NAME ] ) {
                   
                    // targeted function is private and inaccessible from current context, 
                    // but let's make sure current context doesn't have it's own private method that has been overwritten
                    if ( !ctx instanceof PHP.VM.ClassPrototype || 
                        ctx[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] === undefined ||
                        ctx[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] !== ctx[ COMPILER.CLASS_NAME ] ) {
                        ENV[ PHP.Compiler.prototype.ERROR ]( "Call to private method " + this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName + "() from context '" + ((ctx instanceof PHP.VM.ClassPrototype) ? ctx[ COMPILER.CLASS_NAME ] : '') + "'", PHP.Constants.E_ERROR, true );
                    }
                    
                }
                
              
            }

            // favor current context's private method
            if ( ctx instanceof PHP.VM.ClassPrototype && 
                ctx[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ] !== undefined &&
                checkType( ctx[ methodTypePrefix + methodName ], PRIVATE ) &&
                ctx[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] === ctx[ COMPILER.CLASS_NAME ] ) {
                
                return this.callMethod.call( ctx, methodName, args );
                
            }
            

            return this.callMethod.call( this, methodName, args );
            
           
            
           
              
        };
        
        Class.prototype.callMethod = callMethod;
        
        
        Class.prototype[  COMPILER.STATIC_CALL  ] = function( ctx, methodClass, methodName ) {
            
            var args = Array.prototype.slice.call( arguments, 3 );

            if ( typeof this[ methodPrefix + methodName ] !== "function" ) {
                // no method with that name found
                  
                if ( typeof this[ methodPrefix + __call ] === "function" ) {
                    // __call method defined, let's call that instead then
                    
                    
                    // determine which __call to use in case there are several defined
                    if ( ctx instanceof PHP.VM ) {
                        // normal call, use current context
                        return callMethod.call( this, __call, [ new PHP.VM.Variable( methodName ), new PHP.VM.Variable( PHP.VM.Array.fromObject.call( ENV, args ) ) ] );
                    } else {
                        // static call, ensure current scope's __call() is favoured over the specified class's  __call()
                        return ctx.callMethod.call( ctx, __call, [ new PHP.VM.Variable( methodName ), new PHP.VM.Variable( PHP.VM.Array.fromObject.call( ENV, args ) ) ] );
                    }
               
                }
                  
            } else {
               
                if ( checkType( this[ methodTypePrefix + methodName ], PRIVATE ) && this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] !== ctx[ COMPILER.CLASS_NAME ] ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Call to private method " + this[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ][ COMPILER.CLASS_NAME ] + "::" + methodName + "() from context '" + ((ctx instanceof PHP.VM.ClassPrototype) ? ctx[ COMPILER.CLASS_NAME ] : '') + "'", PHP.Constants.E_ERROR, true ); 
                }
                
              
            }
           
           
            var methodToCall,
            methodCTX,
            $;
            
            if ( /^parent$/i.test( methodClass ) ) {
                var proto = Object.getPrototypeOf( Object.getPrototypeOf( this ) );
                
                methodToCall = proto[ methodPrefix + methodName ];
                methodCTX = proto[ PHP.VM.Class.METHOD_PROTOTYPE + methodName ];
                
                $ = buildVariableContext.call( this, methodName, args, methodCTX[ COMPILER.CLASS_NAME ] );
           

   
                if ( checkType( proto[ methodTypePrefix + methodName ], PRIVATE ) && methodCTX[ COMPILER.CLASS_NAME ] !== ctx[ COMPILER.CLASS_NAME ] ) {
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Call to private method " + methodCTX[ COMPILER.CLASS_NAME ] + "::" + methodName + "() from context '" + ((ctx instanceof PHP.VM.ClassPrototype) ? ctx[ COMPILER.CLASS_NAME ] : '') + "'", PHP.Constants.E_ERROR, true ); 
                }
               
                if ( checkType( proto[ methodTypePrefix + methodName ], ABSTRACT ) ) {
                    
                    ENV[ PHP.Compiler.prototype.ERROR ]( "Cannot call abstract method " + methodCTX[ COMPILER.CLASS_NAME ] + "::" + methodName + "()", PHP.Constants.E_ERROR, true ); 
                }
   
                return methodToCall.call( this, $, methodCTX );
            } 
            
            
           
           
            return this.callMethod.call( this, methodName, args );
            
 
        };
        
        Class.prototype[ COMPILER.STATIC_PROPERTY_GET ] = function( ctx, propertyClass, propertyName ) {
            
            var methodCTX;
            if ( /^self$/i.test( propertyClass ) ) {
                methodCTX = ctx;
            } else if ( /^parent$/i.test( propertyClass )) {
                methodCTX = Object.getPrototypeOf( ctx );
            } else {
                methodCTX = this;
            }
            
            
            return methodCTX[ propertyPrefix + propertyName ];
            
            
        };
        
        Class.prototype[ COMPILER.CLASS_CONSTANT_FETCH ] = function( ctx, constantName ) {
            if ( this[ PHP.VM.Class.CONSTANT + constantName ] === undefined && DECLARED === true ) {  
                ENV[ PHP.Compiler.prototype.ERROR ]( "Undefined class constant '" + constantName + "'", PHP.Constants.E_ERROR, true ); 
            } else if ( this[ PHP.VM.Class.CONSTANT + constantName ] === undefined ) {
                //  undefinedConstants
                if ( undefinedConstants[ className + "::" + constantName] === undefined ) {
                    var variable = new PHP.VM.Variable();
                    variable[ VARIABLE.CLASS_CONSTANT ] = true;
                    variable[ VARIABLE.DEFINED ] = className + "::$" + constantName;
                    undefinedConstants[ className + "::" + constantName] = variable;
                    
                }
                
                return undefinedConstants[ className + "::" + constantName];
            }
            
            
            
            return this[ PHP.VM.Class.CONSTANT + constantName ];

        };
        
        Class.prototype[ COMPILER.CLASS_PROPERTY_GET ] = function( ctx, propertyName ) {
           
            if ( this[ propertyPrefix + propertyName ] === undefined ) {


                var obj = {}, props = {};
                
                // property set
                if ( this[ methodPrefix + __set ] !== undefined ) {
                    obj [ COMPILER.ASSIGN ] = function( value ) {
                        console.log( propertyName, value );
                        callMethod.call( this, __set,  [ new PHP.VM.Variable( propertyName ), value ] );        
                    }.bind( this );
                }
                
                // Post inc ++
                // getting value
                obj [ COMPILER.POST_INC ] = function() {
                    console.log( "getting ");
                    if ( this[ methodPrefix + __get ] !== undefined ) {
                     
                        var value = callMethod.call( this, __get, [ new PHP.VM.Variable( propertyName ) ] );  
                        
                        console.log('sup', obj);
                        // setting ++
                        if ( this[ methodPrefix + __set ] !== undefined ) {
                            
                            callMethod.call( this, __set,  [ new PHP.VM.Variable( propertyName ), ( value instanceof PHP.VM.Variable ) ? ++value[ COMPILER.VARIABLE_VALUE ] : new PHP.VM.Variable( 1 ) ] );    
                        }
                        console.log( obj );
                        return value;
                
                    }
                }.bind( this );
                
                var $this = this;
                // property get
                if ( this[ methodPrefix + __get ] !== undefined ) {
                  
                    props[ COMPILER.VARIABLE_VALUE ] = {
                        get : function(){
                            console.log( "getting", propertyName );
                            console.log( $this );
                            return callMethod.call( $this, __get, [ new PHP.VM.Variable( propertyName ) ] )[ COMPILER.VARIABLE_VALUE ];   
                             
                            
                        }
                    };
                    
                    props[ VARIABLE.TYPE ] = {
                        get: function() {
                            console.log( VARIABLE.TYPE );
                            obj = callMethod.call( $this, __get, [ new PHP.VM.Variable( propertyName ) ] );   
                            return obj[ VARIABLE.TYPE ];
                        }
                      
                    };
                    
                    Object.defineProperties( obj, props );
                          
                } else {
                    var variable = new PHP.VM.Variable();
                    variable[ VARIABLE.PROPERTY ] = true;
                    variable[ VARIABLE.DEFINED ] = className + "::$" + propertyName;
                    return variable;
                    
                }
                return obj;
              
                
            } else {

                
                if ( ctx instanceof PHP.VM.ClassPrototype && this[ PHP.VM.Class.CLASS_PROPERTY + ctx[ COMPILER.CLASS_NAME ] + "_" + propertyPrefix + propertyName ] !== undefined ) {
                    // favor current context over object only if current context property is private
                    if ( checkType( ctx[ propertyTypePrefix + propertyName ], PRIVATE ) ) {
                        return this[ PHP.VM.Class.CLASS_PROPERTY + ctx[ COMPILER.CLASS_NAME ] + "_" + propertyPrefix + propertyName ];
                    }
                }
                
                
                return this[ propertyPrefix + propertyName ];
            }
            
            
        };
        
        
        Class.prototype[ COMPILER.CLASS_DESTRUCT ] = function( ctx ) {
            
            console.log('destruct', ctx);
            if ( Object.getPrototypeOf( this ).hasOwnProperty(  methodPrefix + __construct  ) ) {
                return callMethod.call( this, __destruct, [] );         
            }
                

                
            // PHP 5 style constructor in any inherited class
                
            else if ( typeof this[ methodPrefix + __construct ] === "function" ) {
                return callMethod.call( this, __destruct, [] );         
            }
            
           
            
        };
        
        // register class
        classRegistry[ className.toLowerCase() ] = Class;
        
        
        var constant$ = PHP.VM.VariableHandler();
        
   
        constant$("$__FILE__")[ COMPILER.VARIABLE_VALUE ] = "__FILE__";
         
        //   constant$("$__FILE__")[ COMPILER.VARIABLE_VALUE ] = ENV[ COMPILER.GLOBAL ]('_SERVER')[ COMPILER.VARIABLE_VALUE ][ COMPILER.METHOD_CALL ]( ENV, COMPILER.ARRAY_GET, 'SCRIPT_FILENAME' )[ COMPILER.VARIABLE_VALUE ];
        
        constant$("$__METHOD__")[ COMPILER.VARIABLE_VALUE ] = className;
        
        constant$("$__CLASS__")[ COMPILER.VARIABLE_VALUE ] = className;
        
        constant$("$__FUNCTION__")[ COMPILER.VARIABLE_VALUE ] = "";
        
        constant$("$__LINE__")[ COMPILER.VARIABLE_VALUE ] = 1;
        
        classDefinition.call( Class, methods, constant$ );
        
        return methods;
    };
    

    
};
PHP.VM.ClassPrototype = function() {};

PHP.VM.Class.METHOD = "_";

PHP.VM.Class.CLASS_PROPERTY = "_£";

PHP.VM.Class.INTERFACES = "$Interfaces";

PHP.VM.Class.METHOD_PROTOTYPE = "$MP";

PHP.VM.Class.CONSTANT = "€";

PHP.VM.Class.PROPERTY = "$$";

PHP.VM.Class.Predefined = {};

PHP.VM.Class.PUBLIC = 1;
PHP.VM.Class.PROTECTED = 2;
PHP.VM.Class.PRIVATE = 4;
PHP.VM.Class.STATIC = 8;
PHP.VM.Class.ABSTRACT = 16;
PHP.VM.Class.FINAL = 32;
PHP.VM.Class.INTERFACE = 64;

/* 
 * @author Niklas von Hertzen <niklas at hertzen.com>
 * @created 24.6.2012 
 * @website http://hertzen.com
 */

PHP.VM.VariableHandler = function( ENV ) {
    
    var variables = {},
    methods = function( variableName, setTo ) {
        
        if (setTo instanceof PHP.VM.Variable) {
            variables[ variableName ] = setTo;
            return methods;
        }
        
        if ( variables[ variableName ] === undefined ) { 
            
          
            variables[ variableName ] = new PHP.VM.Variable();
            variables[ variableName ][ PHP.VM.Variable.prototype.DEFINED ] = variableName;
            variables[ variableName ].ENV = ENV;
           
        /*
            Object.defineProperty( variables, variableName, {
                value: new PHP.VM.Variable()
            });
            
           
           
           
            Object.defineProperty( variables, variableName, {
                value: Object.defineProperty( {}, PHP.Compiler.prototype.VARIABLE_VALUE, {
                        set: function( val ) {
                            // we are setting a val to a newly created variable
                           variables[ variableName ] = new PHP.VM.Variable( val );
                        },
                        get: function() {
                            // attempting to retrieve a value of undefined property
                            console.log( variables );
                            console.log( variableName + " not defined");
                        }
                    }
                
                )
            });
             */
            
        }

        
        
        return variables[ variableName ];
    };
    
    return methods;
    
};

PHP.VM.VariableProto = function() {

    }

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.ASSIGN ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype;

    this[ COMPILER.VARIABLE_VALUE ] = combinedVariable[ COMPILER.VARIABLE_VALUE ];
    
    return this;
    
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.CONCAT ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype;

    return new PHP.VM.Variable( this[ VARIABLE.CAST_STRING ][ COMPILER.VARIABLE_VALUE ] + "" + combinedVariable[ VARIABLE.CAST_STRING ][ COMPILER.VARIABLE_VALUE ] );
};


PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.ADD ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ] - 0) + ( combinedVariable[ COMPILER.VARIABLE_VALUE ] - 0 ) );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.MUL ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ] - 0) * ( combinedVariable[ COMPILER.VARIABLE_VALUE ] - 0 ) );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.DIV ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ] - 0) / ( combinedVariable[ COMPILER.VARIABLE_VALUE ] - 0 ) );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.MOD ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ]) % ( combinedVariable[ COMPILER.VARIABLE_VALUE ]) );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.MINUS ] = function( combinedVariable ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ] - 0) - ( combinedVariable[ COMPILER.VARIABLE_VALUE ] - 0 ) );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.METHOD_CALL ] = function() {
    
    var COMPILER = PHP.Compiler.prototype;
    
    return this[ COMPILER.VARIABLE_VALUE ][ PHP.Compiler.prototype.METHOD_CALL ].apply( this[ COMPILER.VARIABLE_VALUE ], arguments );
};

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.EQUAL ] = function( compareTo ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ]) == ( compareTo[ COMPILER.VARIABLE_VALUE ]) );
};
 
PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.SMALLER_OR_EQUAL ] = function( compareTo ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ]) <= ( compareTo[ COMPILER.VARIABLE_VALUE ]) );
}; 

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.SMALLER ] = function( compareTo ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ]) < ( compareTo[ COMPILER.VARIABLE_VALUE ]) );
}; 

PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.GREATER ] = function( compareTo ) {
    
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ COMPILER.VARIABLE_VALUE ]) > ( compareTo[ COMPILER.VARIABLE_VALUE ]) );
}; 
 
PHP.VM.VariableProto.prototype[ PHP.Compiler.prototype.BOOLEAN_OR ] = function( compareTo ) { 
    var COMPILER = PHP.Compiler.prototype;
    return new PHP.VM.Variable( (this[ this.CAST_STRING ][ COMPILER.VARIABLE_VALUE ]) | ( compareTo[ this.CAST_STRING ][ COMPILER.VARIABLE_VALUE ]) ); 
};

PHP.VM.Variable = function( arg ) {

    var value,
    POST_MOD = 0,
    __toString = "__toString",
    COMPILER = PHP.Compiler.prototype,
    setValue = function( newValue ) {
        this[ this.DEFINED ] = true;
        
        if ( newValue === undefined ) {
            newValue = null;
        }
        
        if ( newValue instanceof PHP.VM.Variable ) {
            newValue = newValue[ COMPILER.VARIABLE_VALUE ];
        }
        
        if ( typeof newValue === "string" ) {
            this[ this.TYPE ] = this.STRING;
        } else if ( typeof newValue === "number" ) {
            if ( newValue % 1 === 0 ) {
                this[ this.TYPE ] = this.INT;
            } else {
                this[ this.TYPE ] = this.FLOAT;
            }
        } else if ( newValue === null ) {   
            
            if ( this[ this.TYPE ] === this.OBJECT && value instanceof PHP.VM.ClassPrototype ) {
                value[ COMPILER.CLASS_DESTRUCT ]();
            }
            
            this[ this.TYPE ] = this.NULL;

        } else if ( typeof newValue === "boolean" ) {
            this[ this.TYPE ] = this.BOOL;
        } else if ( newValue instanceof PHP.VM.ClassPrototype ) {
            if ( newValue[ COMPILER.CLASS_NAME ] === PHP.VM.Array.prototype.CLASS_NAME ) {
                this[ this.TYPE ] = this.ARRAY;
            } else {

                this[ this.TYPE ] = this.OBJECT;
            }
        } else if ( newValue instanceof PHP.VM.Resource ) {    
            this[ this.TYPE ] = this.RESOURCE;
        } else {
         
        }
        value = newValue;
        
        // remove this later, debugging only
        this.val = newValue;
        
        if ( typeof this[this.REGISTER_SETTER ] === "function" ) {
            this[ this.REGISTER_SETTER ]( value );
        }
        
    };
    
    
    setValue.call( this, arg );
    
    this[ PHP.Compiler.prototype.NEG ] = function() {
        value = -value;
        return this;
    };
    
    Object.defineProperty( this, COMPILER.PRE_INC,
    {
        get : function(){
            value++;
            return this;
        }
    });
    
    Object.defineProperty( this, COMPILER.PRE_DEC,
    {
        get : function(){
            value--;
            return this;
        }
    });

    this[ COMPILER.POST_INC ] = function() {
        var tmp = this[ COMPILER.VARIABLE_VALUE ]; // trigger get, incase there is POST_MOD
        POST_MOD++;
        this.POST_MOD = POST_MOD;
        return this;
        
    };


    
    Object.defineProperty( this, COMPILER.POST_DEC,
    {
        get : function(){
            var tmp = this[ COMPILER.VARIABLE_VALUE ]; // trigger get, incase there is POST_MOD
            
            POST_MOD--;
            this.POST_MOD = POST_MOD;
            return this;
        }
    });
    

   
    this[ PHP.Compiler.prototype.UNSET ] = function() {
        setValue( null );
        this.DEFINED = false;
    };
    
    Object.defineProperty( this, COMPILER.VARIABLE_VALUE,
    {
        get : function(){
            var $this = this,
            returning;
            if ( this[ this.REFERRING ] !== undefined ) {
                $this = this[this.REFERRING];
            }
            
            if ( $this[ this.DEFINED ] !== true && $this[ COMPILER.SUPPRESS ] !== true ) {
                
                if ( $this[ this.CONSTANT ] === true ) {
                    this.ENV[ COMPILER.ERROR ]("Use of undefined constant " + $this[ this.DEFINED ] + " - assumed '" + $this[ this.DEFINED ] + "'", PHP.Constants.E_CORE_NOTICE, true );
                    $this[ this.TYPE ] = this.STRING;
                    return $this[ this.DEFINED ];
                } else {
                    this.ENV[ COMPILER.ERROR ]("Undefined " + ($this[ this.PROPERTY ] === true ? "property" : "variable") + ": " + $this[ this.DEFINED ], PHP.Constants.E_CORE_NOTICE, true );    
                }
            }
            if ( this[ this.REFERRING ] === undefined ) {
                returning = value;
            } else { 
                this[ this.TYPE ] = $this[ this.TYPE ];
                returning = $this[ COMPILER.VARIABLE_VALUE ];
            }
            
            // perform POST_MOD change
           
            if ( POST_MOD !== 0 ) {
                value = POST_MOD + (value - 0);
                POST_MOD = 0; // reset counter
            }
            
            
            return returning;
        },  
        set : setValue
    }
    );
    
    Object.defineProperty( this, this.CAST_BOOL,
    {
        get : function(){
            // http://www.php.net/manual/en/language.types.boolean.php#language.types.boolean.casting
            
            var value = this[ COMPILER.VARIABLE_VALUE ]; // trigger get, incase there is POST_MOD
            
            if ( this[ this.TYPE ] === this.INT ) {
                if ( value === 0 ) {
                    return new PHP.VM.Variable( false );
                } else {
                    return new PHP.VM.Variable( true );
                }
            } else if ( this[ this.TYPE ] === this.STRING ) {
                if ( value.length === 0 || value === "0") {
                    return new PHP.VM.Variable( false );
                } else {
                    return new PHP.VM.Variable( true );
                }
            } else if ( this[ this.TYPE ] === this.NULL ) {
                return new PHP.VM.Variable( false );
            }
            
            return this;
        }
    }
    );
        
    Object.defineProperty( this, this.CAST_STRING,
    {
        get : function() {
            //   http://www.php.net/manual/en/language.types.string.php#language.types.string.casting
            
            var value = this[ COMPILER.VARIABLE_VALUE ]; // trigger get, incase there is POST_MOD
            
            if ( value instanceof PHP.VM.ClassPrototype && value[ COMPILER.CLASS_NAME ] !== PHP.VM.Array.prototype.CLASS_NAME  ) {
                // class
                // check for __toString();
                
                if ( typeof value[PHP.VM.Class.METHOD + __toString ] === "function" ) {
                    return new PHP.VM.Variable( value[PHP.VM.Class.METHOD + __toString ]() );
                }
                     
            } else if (this[ this.TYPE ] === this.BOOL) {
                return new PHP.VM.Variable( ( value ) ? "1" : "0" );
            } else if (this[ this.TYPE ] === this.INT) {
                return new PHP.VM.Variable(  value + "" );
            } else if (this[ this.TYPE ] === this.NULL) {
                return new PHP.VM.Variable( "" );
            }
            return this;
        }
    }
    );

    Object.defineProperty( this, COMPILER.DIM_FETCH,
    {
        get : function(){
         
            return function( ctx, variable ) {
                
               
                
                if ( this[ this.TYPE ] !== this.ARRAY ) {
                    if ( this[ this.TYPE ] === this.OBJECT && value[ PHP.VM.Class.INTERFACES ].indexOf("ArrayAccess") !== -1) {
                       
                       var exists = value[ COMPILER.METHOD_CALL ]( ctx, "offsetExists", variable )[ COMPILER.VARIABLE_VALUE ]; // trigger offsetExists
                       console.log( exists, value );
                        if ( exists === true ) { 
                            return  value[ COMPILER.METHOD_CALL ]( ctx, COMPILER.ARRAY_GET, variable );
                        } else {
                            return new PHP.VM.Variable();
                        }
                        
                    } else {
                                      console.log( this );
                        this [ COMPILER.VARIABLE_VALUE ] = this.ENV.array([]);
                    }
                } 
  
                //  console.log(value[ COMPILER.METHOD_CALL ]( ctx, COMPILER.ARRAY_GET, variable ));
                return  value[ COMPILER.METHOD_CALL ]( ctx, COMPILER.ARRAY_GET, variable );
                
            };
        },  
        set : setValue
    }
    );
    
    
    return this;
    
};

PHP.VM.Variable.prototype = new PHP.VM.VariableProto();

PHP.VM.Variable.prototype.DEFINED = "$Defined";

PHP.VM.Variable.prototype.CAST_BOOL = "$Bool";

PHP.VM.Variable.prototype.CAST_STRING = "$String";

PHP.VM.Variable.prototype.NULL = 0;
PHP.VM.Variable.prototype.BOOL = 1;
PHP.VM.Variable.prototype.INT = 2;
PHP.VM.Variable.prototype.FLOAT = 3;
PHP.VM.Variable.prototype.STRING = 4;
PHP.VM.Variable.prototype.ARRAY = 5;
PHP.VM.Variable.prototype.OBJECT = 6;
PHP.VM.Variable.prototype.RESOURCE = 7;
PHP.VM.Variable.prototype.TYPE = "type";

PHP.VM.Variable.prototype.PROPERTY = "$Property";

PHP.VM.Variable.prototype.CONSTANT = "$Constant";

PHP.VM.Variable.prototype.CLASS_CONSTANT = "$ClassConstant";

PHP.VM.Variable.prototype.REFERRING = "$Referring";

PHP.VM.Variable.prototype.REGISTER_SETTER = "$Setter";
/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 27.6.2012 
* @website http://hertzen.com
 */

PHP.VM.Array = function( ENV ) {
   
    var COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype,
    $this = this;
    
    ENV.$Class.New( "ArrayObject", 0, {}, function( M ) {
    
        // internal storage for keys/values
        M[ COMPILER.CLASS_PROPERTY ]( $this.KEYS, PHP.VM.Class.PRIVATE, [] )
        [ COMPILER.CLASS_PROPERTY ]( $this.VALUES, PHP.VM.Class.PRIVATE, [] )
    
        // internal key of largest previously used (int) key
        [ COMPILER.CLASS_PROPERTY ]( $this.INTKEY, PHP.VM.Class.PRIVATE, -1 )
    
    
        // internal pointer
        [ COMPILER.CLASS_PROPERTY ]( $this.POINTER, PHP.VM.Class.PRIVATE, 0 )
    
        /*
     * __construct method
     */ 
        [ COMPILER.CLASS_METHOD ]( "__construct", PHP.VM.Class.PUBLIC, [{
            "name":"input"
        }], function( $ ) {
            this[ COMPILER.CLASS_NAME ] = $this.CLASS_NAME;
        
            var items = $('input')[ COMPILER.VARIABLE_VALUE ];
            if ( Array.isArray( items ) ) {
           
                items.forEach( function( item ) {
               
                    // this.$Prop( this, $this.VALUES ).$.push( item[ COMPILER.ARRAY_VALUE ] );
                    if (item[ COMPILER.ARRAY_VALUE ][ VARIABLE.CLASS_CONSTANT ] !== true && item[ COMPILER.ARRAY_VALUE ][ VARIABLE.CONSTANT ] !== true) {
                        this.$Prop( this, $this.VALUES )[ COMPILER.VARIABLE_VALUE ].push( new PHP.VM.Variable( item[ COMPILER.ARRAY_VALUE ][ COMPILER.VARIABLE_VALUE ] ) );
                    } else {
                        console.log(item[ COMPILER.ARRAY_VALUE ]);
                        this.$Prop( this, $this.VALUES )[ COMPILER.VARIABLE_VALUE ].push( item[ COMPILER.ARRAY_VALUE ] );
                    }
                    
                
                    if ( item[ COMPILER.ARRAY_KEY ] !== undefined ) {
                        if ( !item[ COMPILER.ARRAY_KEY ] instanceof PHP.VM.Variable || (item[ COMPILER.ARRAY_KEY ][ VARIABLE.CLASS_CONSTANT ] !== true && item[ COMPILER.ARRAY_KEY ][ VARIABLE.CONSTANT ] !== true )) {
                            var key = ( item[ COMPILER.ARRAY_KEY ] instanceof PHP.VM.Variable ) ? item[ COMPILER.ARRAY_KEY ][ COMPILER.VARIABLE_VALUE ] : item[ COMPILER.ARRAY_KEY ];
                   
                            if ( /^\d+$/.test( key )) {
                                // integer key
                        
                                this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].push( key );
                        
                                // todo complete
                                this.$Prop( this, $this.INTKEY )[ COMPILER.VARIABLE_VALUE ] = Math.max( this.$Prop( this, $this.INTKEY )[ COMPILER.VARIABLE_VALUE ], key );
                            } else {
                                // custom text key
                                this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].push( key );
                            }
                        } else {
                            // class constant as key
                           
                            this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].push( item[ COMPILER.ARRAY_KEY ] );
                      
                        }
                    } else {
                        this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].push( ++this.$Prop( this, $this.INTKEY )[ COMPILER.VARIABLE_VALUE ] );
                    }
                
                

                }, this);
            }
    
       
        
        } )
    
    
        /*
     * offsetGet method
     */ 
        [ COMPILER.CLASS_METHOD ]( COMPILER.ARRAY_GET, PHP.VM.Class.PUBLIC, [{
            "name":"index"
        }], function( $ ) {
         
            var index = -1,
            value = $('index')[ COMPILER.VARIABLE_VALUE ];
            this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].some(function( item, i ){
                
                if ( item instanceof PHP.VM.Variable ) {
                    item = item[ COMPILER.VARIABLE_VALUE ];
                } 
                
          
                
                if ( item === value) {
                    index = i;
                    return true;
                }
                
                return false;
            });

            if ( index !== -1 ) {
                return this.$Prop( this, $this.VALUES )[ COMPILER.VARIABLE_VALUE ][ index ];
            } else {
                // no such key found in array, let's create one
                //    
                var variable = new PHP.VM.Variable();
                //    
                variable[ VARIABLE.DEFINED  ] = false;
                variable[ VARIABLE.REGISTER_SETTER ] = function() {
                    // the value was actually defined, let's register item into array
                    this.$Prop( this, $this.KEYS )[ COMPILER.VARIABLE_VALUE ].push( ($('index')[ COMPILER.VARIABLE_VALUE ] !== null) ? $('index')[ COMPILER.VARIABLE_VALUE ] : ++this.$Prop( this, $this.INTKEY )[ COMPILER.VARIABLE_VALUE ] );
                    this.$Prop( this, $this.VALUES )[ COMPILER.VARIABLE_VALUE ].push( variable );
                    delete variable[ VARIABLE.REGISTER_SETTER ];
                }.bind(this);
            
                return variable;
            
            }

        
        } )
    
        .Create();
    
    });

    /*
 Convert JavaScript array/object into a PHP array 
 */


    PHP.VM.Array.fromObject = function( items ) {

        var arr = [],
        obj,
   
        addItem = function( value, key ) {
            obj = {};
            obj[ PHP.Compiler.prototype.ARRAY_KEY ] = key;
        
            if ( value instanceof PHP.VM.Variable ) {
                obj[ PHP.Compiler.prototype.ARRAY_VALUE ] = value;
            } else if ( typeof value === "object" && value !== null ) {
                obj[ PHP.Compiler.prototype.ARRAY_VALUE ] = PHP.VM.Array.fromObject.call( this, value );
            } else {
                obj[ PHP.Compiler.prototype.ARRAY_VALUE ] = new PHP.VM.Variable( value );
            }
            arr.push( obj );
        
        }.bind(this);
     
     
     
        if (Array.isArray( items ) ) {
            items.forEach( addItem );
        } else {
            Object.keys( items ).forEach( function( key ) {
                addItem( items[ key ], key );   
            });
        }
    
   
 

    
    

        return this.array( arr );


    };
};

PHP.VM.Array.prototype.KEYS = "keys";
PHP.VM.Array.prototype.VALUES = "values";

PHP.VM.Array.prototype.INTKEY = "intkey";

PHP.VM.Array.prototype.POINTER = "pointer";

PHP.VM.Array.prototype.CLASS_NAME = "array";/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 1.7.2012 
* @website http://hertzen.com
 */

PHP.VM.ResourceManager = function() {
    
    
    var resources = [],
    RESOURCE = PHP.VM.ResourceManager.prototype,
    id = 0,
    methods = {};
    
    methods[ RESOURCE.REGISTER ] = function() {

        var resource = new PHP.VM.Resource( id++ );
        resources.push( resource );
        

        return resource;
        
    };
    
    
    return methods;
       
    
};

PHP.VM.ResourceManager.prototype.ID = "$Id";

PHP.VM.ResourceManager.prototype.REGISTER = "$Register";

PHP.VM.Resource = function( id ) {
    this[ PHP.VM.ResourceManager.prototype.ID ] = id;
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 29.6.2012 
* @website http://hertzen.com
 */

PHP.VM.Constants = function(  predefined, ENV ) {
    
    var constants = {},
    constantVariables = {},
    COMPILER = PHP.Compiler.prototype,
    VARIABLE = PHP.VM.Variable.prototype,
    methods = {};
    
    Object.keys( predefined ).forEach(function( key ){
       
        constants[ key ] = predefined[ key ];
    }, this); 
    
    methods[ COMPILER.CONSTANT_GET ] = function( constantName ) {
        
        var variable = new PHP.VM.Variable( constants[ constantName ] ); 
        
        if ( constants[ constantName ] === undefined  ) {
            
            if ( constantVariables[ constantName ] === undefined ) {
                constantVariables[ constantName ] = variable;
            } else {
                return constantVariables[ constantName ];
            }  
            
            variable[ VARIABLE.DEFINED ] = constantName;
            variable[ VARIABLE.CONSTANT ] = true;
            
            
            
            
        }
        
        return variable;    
    };
    
    methods[ COMPILER.CONSTANT_SET ] = function( constantName, constantValue ) {
              
        if ( constantVariables[ constantName ] !== undefined ) {
            constantVariables[ constantName ][ COMPILER.VARIABLE_VALUE ] = constantValue;
        }
        constants[ constantName ] = constantValue;
    };
    
    return methods;
    
};/* 
* @author Niklas von Hertzen <niklas at hertzen.com>
* @created 4.7.2012 
* @website http://hertzen.com
 */


PHP.VM.Class.Predefined.Exception = function( ENV) {
    
    // var COMPILER = PHP.Compiler.prototype,
    //  $this = this;
    
    ENV.$Class.New( "Exception", 0, {}, function( M ) {
        M.Create();
    });
    
    
};/* automatically built from stdClass.php*/
PHP.VM.Class.Predefined.stdClass = function( ENV ) {
ENV.$Class.New( "stdClass", 0, {}, function( M, $ ){
 M.Create()});

};/* automatically built from ArrayAccess.php*/
PHP.VM.Class.Predefined.ArrayAccess = function( ENV ) {
ENV.$Class.INew( "ArrayAccess", [], function( M, $ ){
 M.Method( "offsetExists", 1, [{"name":"offset"}], function( $, ctx ) {
})
.Method( "offsetGet", 1, [{"name":"offset"}], function( $, ctx ) {
})
.Method( "offsetSet", 1, [{"name":"offset"},{"name":"value"}], function( $, ctx ) {
})
.Method( "offsetUnset", 1, [{"name":"offset"}], function( $, ctx ) {
})
.Create()});

};