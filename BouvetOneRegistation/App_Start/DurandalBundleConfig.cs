using System;
using System.Web.Optimization;

namespace BouvetOneRegistation {
  public class DurandalBundleConfig {
    public static void RegisterBundles(BundleCollection bundles) {
      bundles.IgnoreList.Clear();
      AddDefaultIgnorePatterns(bundles.IgnoreList);

	  bundles.Add(
		new ScriptBundle("~/Scripts/vendor.js")
			.Include("~/Scripts/jquery-{version}.js")
			.Include("~/Scripts/bootstrap.js")
			.Include("~/Scripts/knockout-{version}.js")
            .Include("~/Scripts/toastr.min.js")
            .Include("~/Scripts/underscore.min.js")
            .Include("~/Scripts/jquery.hammer.min.js")
            .Include("~/Scripts/Stashy.js")
            .Include("~/Scripts/underscore.min.js")
            .Include("~/Scripts/moment.js")
            .Include("~/Scripts/q.min.js")
            .Include("~/Scripts/gridster.js")
		);

        bundles.Add(new StyleBundle("~/Content/Bouvet")
             .Include("~/Content/bouvet/bouvetone.css")
        );
        
        bundles.Add(
        new StyleBundle("~/Content/css")
          .Include("~/Content/ie10mobile.css")
          .Include("~/Content/font-awesome.min.css")
		  .Include("~/Content/durandal.css")
          .Include("~/Content/starterkit.css")
          .Include("~/Content/toastr.min.css")
          .Include("~/Content/Stashy.css")
          .Include("~/Content/site.css")
          .Include("~/Content/gridster.css")
        );

        bundles.Add(new StyleBundle("~/Content/bootstrap")
            .Include("~/Content/bootstrap/bootstrap.min.css")
        );
    
    }

    public static void AddDefaultIgnorePatterns(IgnoreList ignoreList) {
      if(ignoreList == null) {
        throw new ArgumentNullException("ignoreList");
      }

      ignoreList.Ignore("*.intellisense.js");
      ignoreList.Ignore("*-vsdoc.js");
      ignoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
      //ignoreList.Ignore("*.min.js", OptimizationMode.WhenDisabled);
      //ignoreList.Ignore("*.min.css", OptimizationMode.WhenDisabled);
    }
  }
}